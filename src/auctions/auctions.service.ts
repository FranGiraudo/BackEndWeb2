import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async placeBid(auctionId: number, userId: number, dto: CreateBidDto) {
    const MINIMUM_MARGIN = 100;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Obtener la subasta con bloqueo pesimista (row-level lock) para evitar condiciones de carrera.
      // Nota: Prisma no soporta FOR UPDATE nativo en $transaction sin raw queries en todos los conectores, 
      // pero para este caso evaluaremos el estado actual.
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) {
        throw new NotFoundException('La subasta no existe.');
      }

      if (!auction.isActive) {
        throw new BadRequestException('Esta subasta ya no se encuentra activa.');
      }

      if (new Date() > auction.endsAt) {
        throw new BadRequestException('El tiempo de la subasta ha finalizado.');
      }

      if (dto.amount < auction.currentPrice + MINIMUM_MARGIN) {
        throw new BadRequestException(
          `La puja debe superar el precio actual por al menos $${MINIMUM_MARGIN}.`
        );
      }

      // 2. Registrar la puja en la tabla Bid
      const bid = await tx.bid.create({
        data: {
          auctionId: auction.id,
          bidderId: userId,
          amount: dto.amount,
        },
      });

      // 3. Actualizar el precio actual de la subasta
      const updatedAuction = await tx.auction.update({
        where: { id: auction.id },
        data: {
          currentPrice: dto.amount,
        },
      });

      return {
        message: 'Puja registrada exitosamente.',
        auction: updatedAuction,
        bid,
      };
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredAuctions() {
    this.logger.log('Buscando subastas expiradas...');
    const now = new Date();

    const expiredAuctions = await this.prisma.auction.findMany({
      where: {
        isActive: true,
        endsAt: { lte: now },
      },
      include: {
        car: true,
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: { bidder: true },
        },
      },
    });

    for (const auction of expiredAuctions) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Marcar subasta como inactiva
          await tx.auction.update({
            where: { id: auction.id },
            data: { isActive: false },
          });

          // Actualizar el precio del auto con la puja final
          await tx.car.update({
            where: { id: auction.carId },
            data: { price: auction.currentPrice },
          });

          const winnerBid = auction.bids[0];
          if (winnerBid) {
            // Notificar al ganador
            await tx.notification.create({
              data: {
                userId: winnerBid.bidderId,
                title: '¡Subasta Ganada!',
                message: `Felicitaciones, ganaste la subasta del ${auction.car.brand} ${auction.car.model} por u$s ${auction.currentPrice.toLocaleString()}.`,
                type: 'AUCTION_WON',
              },
            });

            // Notificar al vendedor
            await tx.notification.create({
              data: {
                userId: auction.car.sellerId,
                title: 'Subasta Finalizada',
                message: `Tu subasta del ${auction.car.brand} ${auction.car.model} finalizó por u$s ${auction.currentPrice.toLocaleString()}. El ganador fue notificado.`,
                type: 'AUCTION_ENDED',
              },
            });

            // Crear un chat (Inquiry) automático desde el vendedor al ganador
            await tx.inquiry.create({
              data: {
                carId: auction.car.id,
                senderId: auction.car.sellerId,
                sellerId: auction.car.sellerId,
                text: `¡Hola! Soy el dueño de la subasta que acabas de ganar por el ${auction.car.brand} ${auction.car.model} a u$s ${auction.currentPrice.toLocaleString()}. Me comunico para felicitarte y para que coordinemos la entrega y el pago.`,
                senderName: 'Sistema (Vendedor)',
                status: 'En Negociacion',
              },
            });
          }
        });
        this.logger.log(`Subasta ${auction.id} finalizada. Auto ${auction.carId} actualizado a u$s${auction.currentPrice}`);
      } catch (error) {
        this.logger.error(`Error al finalizar subasta ${auction.id}`, error);
      }
    }
  }
}

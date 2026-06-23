import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';

import { AuctionsGateway } from './auctions.gateway';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionsGateway: AuctionsGateway,
  ) {}

  async placeBid(auctionId: number, userId: number, dto: CreateBidDto) {
    const MINIMUM_MARGIN = 100;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Obtener la subasta
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

    // Emit event to WebSocket
    this.auctionsGateway.emitNewBid(
      result.auction.id,
      result.auction.currentPrice,
      result.bid.bidderId,
    );

    return result;
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
          // Marcar subasta como inactiva y setear ganador
          await tx.auction.update({
            where: { id: auction.id },
            data: { 
              isActive: false,
              winnerId: auction.bids[0]?.bidderId || null 
            },
          });

          // Actualizar el precio del auto y cambiar su estado
          await tx.car.update({
            where: { id: auction.carId },
            data: { 
              price: auction.currentPrice,
              status: 'Reservado',
              // Mantenemos isActive en true para que siga siendo visible en el detail y perfil
              isActive: true 
            },
          });

          const winnerBid = auction.bids[0];
          if (winnerBid) {
            // Guardar el auto en favoritos del ganador
            await tx.favorite.upsert({
              where: {
                userId_carId: {
                  userId: winnerBid.bidderId,
                  carId: auction.carId,
                }
              },
              update: {},
              create: {
                userId: winnerBid.bidderId,
                carId: auction.carId,
              }
            });

            // Notificar al ganador
            await tx.notification.create({
              data: {
                userId: winnerBid.bidderId,
                title: '¡Subasta Ganada!',
                message: `Felicitaciones, ganaste la subasta del ${auction.car.brand} ${auction.car.model} por u$s ${auction.currentPrice.toLocaleString()}.`,
                type: 'AUCTION_WON',
                linkUrl: `/pages/detail.html?id=${auction.carId}`,
              },
            });

            // Notificar al vendedor
            await tx.notification.create({
              data: {
                userId: auction.car.sellerId,
                title: '¡Subasta Finalizada!',
                message: `Tu subasta para el ${auction.car.brand} ${auction.car.model} terminó en u$s ${auction.currentPrice.toLocaleString()}.`,
                type: 'AUCTION_ENDED',
                linkUrl: `/pages/detail.html?id=${auction.carId}`,
              },
            });

            // Crear un chat (Inquiry) automático
            // Nota: Para que el sistema de mensajería funcione bien, el senderId DEBE ser el comprador.
            // Para satisfacer la necesidad del vendedor enviando el primer mensaje, creamos la consulta
            // a nombre del sistema o forzamos el texto para que lo inicie el vendedor como Reply.
            const inquiry = await tx.inquiry.create({
              data: {
                carId: auction.car.id,
                senderId: winnerBid.bidderId, // Importante: el comprador es el sender para que le aparezca
                sellerId: auction.car.sellerId,
                text: `[Mensaje Automático] Se ha iniciado la comunicación por la subasta ganada del ${auction.car.brand} ${auction.car.model} a u$s ${auction.currentPrice.toLocaleString()}.`,
                senderName: 'Sistema',
                status: 'En Negociacion',
              },
            });

            // Luego le agregamos una respuesta automática del vendedor
            await tx.reply.create({
              data: {
                inquiryId: inquiry.id,
                text: `¡Hola! Soy el dueño del vehículo. Te escribo automáticamente porque ganaste mi subasta a u$s ${auction.currentPrice.toLocaleString()}. ¡Felicitaciones! Hablemos por acá para coordinar la entrega.`,
                senderName: 'Sistema (Vendedor)',
                senderRole: 'vendedor',
                senderId: auction.car.sellerId
              }
            });
          }
        });
        
        // Emit WebSocket event to notify clients that the auction has ended
        this.auctionsGateway.emitAuctionEnded(
          auction.id,
          auction.currentPrice,
          auction.bids[0]?.bidderId || null
        );

        this.logger.log(`Subasta ${auction.id} finalizada. Auto ${auction.carId} actualizado a u$s${auction.currentPrice}`);
      } catch (error) {
        this.logger.error(`Error procesando subasta ${auction.id}: ${error.message}`);
      }
    }
  }

  async getHistory(userId: number) {
    const auctions = await this.prisma.auction.findMany({
      where: {
        isActive: false,
        OR: [
          { winnerId: userId },
          { car: { sellerId: userId } }
        ]
      },
      include: {
        car: {
          include: {
            images: { orderBy: { isPrimary: 'desc' } }
          }
        },
        winner: {
          select: { id: true, nombre: true, apellido: true, email: true }
        }
      },
      orderBy: { endsAt: 'desc' }
    });

    return auctions;
  }
}

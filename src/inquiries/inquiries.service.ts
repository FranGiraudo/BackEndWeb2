// src/inquiries/inquiries.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Transforma un objeto Inquiry de Prisma al formato que espera el frontend.
   * El frontend (profile.js) espera:
   * { id, autoId, autoMarca, autoModelo, sellerEmail, senderEmail, senderName,
   *   text, date, markedAsReadBy, replies: [...] }
   */
  private formatInquiry(inquiry: any) {
    return {
      id: inquiry.id,
      autoId: inquiry.carId,
      autoMarca: inquiry.car?.brand || '',
      autoModelo: inquiry.car?.model || '',
      sellerEmail: inquiry.seller?.email || '',
      senderEmail: inquiry.sender?.email || '',
      senderName: inquiry.senderName,
      text: inquiry.text,
      date: inquiry.createdAt,
      read: !!inquiry.markedAsReadBy,
      markedAsReadBy: inquiry.markedAsReadBy,
      replies: inquiry.replies?.map((r: any) => ({
        id: r.id,
        text: r.text,
        senderName: r.senderName,
        senderRole: r.senderRole,
        date: r.createdAt,
      })) || [],
    };
  }

  /**
   * POST /api/inquiries
   * Un comprador envía una consulta al vendedor de un vehículo.
   */
  async create(dto: CreateInquiryDto, buyerId: number, buyerName: string) {
    // Verificar que el vehículo existe y está activo
    const car = await this.prisma.car.findFirst({
      where: { id: dto.carId, isActive: true },
      include: { seller: true },
    });

    if (!car) {
      throw new NotFoundException('El vehículo ya no está disponible.');
    }

    // El comprador no puede contactarse consigo mismo
    if (car.sellerId === buyerId) {
      throw new ForbiddenException('No podés contactarte con tu propia publicación.');
    }

    const inquiry = await this.prisma.inquiry.create({
      data: {
        text: dto.text,
        senderName: buyerName,
        carId: dto.carId,
        senderId: buyerId,
        sellerId: car.sellerId,
      },
    });

    // Registrar el contacto en analytics del vehículo
    await this.prisma.car.update({
      where: { id: dto.carId },
      data: { contacts: { increment: 1 } },
    });

    return { success: true, inquiryId: inquiry.id };
  }

  /**
   * GET /api/inquiries/seller
   * Devuelve todos los mensajes recibidos por el vendedor autenticado.
   */
  async getSellerInquiries(sellerId: number) {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { sellerId },
      include: {
        car: { select: { brand: true, model: true } },
        sender: { select: { email: true } },
        seller: { select: { email: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return inquiries.map((i) => this.formatInquiry(i));
  }

  /**
   * GET /api/inquiries/buyer
   * Devuelve todas las consultas enviadas por el comprador autenticado.
   */
  async getBuyerInquiries(buyerId: number) {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { senderId: buyerId },
      include: {
        car: { select: { brand: true, model: true } },
        sender: { select: { email: true } },
        seller: { select: { email: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return inquiries.map((i) => this.formatInquiry(i));
  }

  /**
   * POST /api/inquiries/:id/reply
   * Responde a una consulta. Puede hacerlo el vendedor o el comprador.
   */
  async addReply(
    inquiryId: number,
    dto: CreateReplyDto,
    userId: number,
    userRole: string,
    userName: string,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Consulta no encontrada.');
    }

    // Solo el vendedor o el comprador de esa conversación pueden responder
    if (inquiry.sellerId !== userId && inquiry.senderId !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para responder esta consulta.',
      );
    }

    // Quien responde ya leyó la consulta; el otro participante la verá como nueva
    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { markedAsReadBy: userRole },
    });

    const reply = await this.prisma.reply.create({
      data: {
        text: dto.text,
        senderName: userName,
        senderRole: userRole,
        inquiryId,
        senderId: userId,
      },
    });

    return {
      success: true,
      reply: {
        id: reply.id,
        text: reply.text,
        senderName: reply.senderName,
        senderRole: reply.senderRole,
        date: reply.createdAt,
      },
    };
  }

  /**
   * PUT /api/inquiries/:id/read
   * Marca una consulta como leída por el rol que la está viendo.
   */
  async markAsRead(inquiryId: number, userId: number, userRole: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Consulta no encontrada.');
    }

    if (inquiry.sellerId !== userId && inquiry.senderId !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para marcar esta consulta como leída.',
      );
    }

    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { markedAsReadBy: userRole },
    });

    return { success: true };
  }

  /**
   * DELETE /api/inquiries/:id
   * Elimina una conversación. Solo pueden hacerlo los participantes.
   */
  async remove(inquiryId: number, userId: number) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Consulta no encontrada.');
    }

    if (inquiry.sellerId !== userId && inquiry.senderId !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para eliminar esta conversación.',
      );
    }

    await this.prisma.inquiry.delete({ where: { id: inquiryId } });

    return { success: true, message: 'Conversación eliminada.' };
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InquiriesService = class InquiriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    formatInquiry(inquiry) {
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
            replies: inquiry.replies?.map((r) => ({
                id: r.id,
                text: r.text,
                senderName: r.senderName,
                senderRole: r.senderRole,
                date: r.createdAt,
            })) || [],
        };
    }
    async create(dto, buyerId, buyerName) {
        const car = await this.prisma.car.findFirst({
            where: { id: dto.carId, isActive: true },
            include: { seller: true },
        });
        if (!car) {
            throw new common_1.NotFoundException('El vehículo ya no está disponible.');
        }
        if (car.sellerId === buyerId) {
            throw new common_1.ForbiddenException('No podés contactarte con tu propia publicación.');
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
        await this.prisma.car.update({
            where: { id: dto.carId },
            data: { contacts: { increment: 1 } },
        });
        return { success: true, inquiryId: inquiry.id };
    }
    async getSellerInquiries(sellerId) {
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
    async getBuyerInquiries(buyerId) {
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
    async addReply(inquiryId, dto, userId, userRole, userName) {
        const inquiry = await this.prisma.inquiry.findUnique({
            where: { id: inquiryId },
        });
        if (!inquiry) {
            throw new common_1.NotFoundException('Consulta no encontrada.');
        }
        if (inquiry.sellerId !== userId && inquiry.senderId !== userId) {
            throw new common_1.ForbiddenException('No tenés permiso para responder esta consulta.');
        }
        await this.prisma.inquiry.update({
            where: { id: inquiryId },
            data: { markedAsReadBy: null },
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
    async markAsRead(inquiryId, userId, userRole) {
        const inquiry = await this.prisma.inquiry.findUnique({
            where: { id: inquiryId },
        });
        if (!inquiry) {
            throw new common_1.NotFoundException('Consulta no encontrada.');
        }
        if (inquiry.sellerId !== userId && inquiry.senderId !== userId) {
            throw new common_1.ForbiddenException('No tenés permiso para marcar esta consulta como leída.');
        }
        await this.prisma.inquiry.update({
            where: { id: inquiryId },
            data: { markedAsReadBy: userRole },
        });
        return { success: true };
    }
    async remove(inquiryId, userId) {
        const inquiry = await this.prisma.inquiry.findUnique({
            where: { id: inquiryId },
        });
        if (!inquiry) {
            throw new common_1.NotFoundException('Consulta no encontrada.');
        }
        if (inquiry.sellerId !== userId && inquiry.senderId !== userId) {
            throw new common_1.ForbiddenException('No tenés permiso para eliminar esta conversación.');
        }
        await this.prisma.inquiry.delete({ where: { id: inquiryId } });
        return { success: true, message: 'Conversación eliminada.' };
    }
};
exports.InquiriesService = InquiriesService;
exports.InquiriesService = InquiriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InquiriesService);
//# sourceMappingURL=inquiries.service.js.map
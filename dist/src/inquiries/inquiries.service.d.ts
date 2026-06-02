import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
export declare class InquiriesService {
    private prisma;
    constructor(prisma: PrismaService);
    private formatInquiry;
    create(dto: CreateInquiryDto, buyerId: number, buyerName: string): Promise<{
        success: boolean;
        inquiryId: number;
    }>;
    getSellerInquiries(sellerId: number): Promise<{
        id: any;
        autoId: any;
        autoMarca: any;
        autoModelo: any;
        sellerEmail: any;
        senderEmail: any;
        senderName: any;
        text: any;
        date: any;
        read: boolean;
        markedAsReadBy: any;
        replies: any;
    }[]>;
    getBuyerInquiries(buyerId: number): Promise<{
        id: any;
        autoId: any;
        autoMarca: any;
        autoModelo: any;
        sellerEmail: any;
        senderEmail: any;
        senderName: any;
        text: any;
        date: any;
        read: boolean;
        markedAsReadBy: any;
        replies: any;
    }[]>;
    addReply(inquiryId: number, dto: CreateReplyDto, userId: number, userRole: string, userName: string): Promise<{
        success: boolean;
        reply: {
            id: number;
            text: string;
            senderName: string;
            senderRole: string;
            date: Date;
        };
    }>;
    markAsRead(inquiryId: number, userId: number, userRole: string): Promise<{
        success: boolean;
    }>;
    remove(inquiryId: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}

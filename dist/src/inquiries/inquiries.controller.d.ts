import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
export declare class InquiriesController {
    private readonly inquiriesService;
    constructor(inquiriesService: InquiriesService);
    create(dto: CreateInquiryDto, req: any): Promise<{
        success: boolean;
        inquiryId: number;
    }>;
    getSellerInquiries(req: any): Promise<{
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
    getBuyerInquiries(req: any): Promise<{
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
    addReply(id: number, dto: CreateReplyDto, req: any): Promise<{
        success: boolean;
        reply: {
            id: number;
            text: string;
            senderName: string;
            senderRole: string;
            date: Date;
        };
    }>;
    markAsRead(id: number, req: any): Promise<{
        success: boolean;
    }>;
    remove(id: number, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}

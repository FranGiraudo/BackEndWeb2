import { AiService } from '../ai/ai.service';
import { ImagesService } from './images.service';
export declare class ImagesController {
    private readonly aiService;
    private readonly imagesService;
    constructor(aiService: AiService, imagesService: ImagesService);
    uploadImages(files: Express.Multer.File[], brand: string | undefined, model: string | undefined, price: string | undefined, req: any): {
        success: boolean;
        images: string[];
        primaryImage: string;
        aiAnalysis: {
            bodyType: string;
            aiStatus: string;
            aiDamages: string;
            priceRange: {
                min: number;
                max: number;
            };
        };
    };
}

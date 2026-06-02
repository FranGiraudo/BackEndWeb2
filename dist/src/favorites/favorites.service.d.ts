import { PrismaService } from '../prisma/prisma.service';
export declare class FavoritesService {
    private prisma;
    constructor(prisma: PrismaService);
    private formatCar;
    toggleFavorite(carId: number, userId: number): Promise<{
        success: boolean;
        isFavorite: boolean;
    }>;
    getFavorites(userId: number): Promise<{
        id: any;
        brand: any;
        model: any;
        year: any;
        price: any;
        km: any;
        bodyType: any;
        location: any;
        transmission: any;
        fuel: any;
        description: any;
        image: any;
        images: any;
        aiStatus: any;
        aiDamages: any;
        aiPriceMin: any;
        aiPriceMax: any;
        views: any;
        contacts: any;
        sellerId: any;
        sellerEmail: any;
        sellerName: string | null;
        createdAt: any;
    }[]>;
}

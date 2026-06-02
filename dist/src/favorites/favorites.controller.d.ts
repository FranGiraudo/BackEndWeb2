import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    toggle(carId: number, req: any): Promise<{
        success: boolean;
        isFavorite: boolean;
    }>;
    getFavorites(req: any): Promise<{
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

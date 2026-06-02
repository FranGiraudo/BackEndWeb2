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
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FavoritesService = class FavoritesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    formatCar(car) {
        const imageUrls = car.images?.map((img) => img.url) || [];
        const primaryImage = car.images?.find((img) => img.isPrimary)?.url ||
            imageUrls[0] ||
            null;
        return {
            id: car.id,
            brand: car.brand,
            model: car.model,
            year: car.year,
            price: car.price,
            km: car.km,
            bodyType: car.bodyType,
            location: car.location,
            transmission: car.transmission,
            fuel: car.fuel,
            description: car.description,
            image: primaryImage,
            images: imageUrls,
            aiStatus: car.aiStatus,
            aiDamages: car.aiDamages,
            aiPriceMin: car.aiPriceMin,
            aiPriceMax: car.aiPriceMax,
            views: car.views,
            contacts: car.contacts,
            sellerId: car.sellerId,
            sellerEmail: car.seller?.email,
            sellerName: car.seller
                ? `${car.seller.nombre} ${car.seller.apellido}`
                : null,
            createdAt: car.createdAt,
        };
    }
    async toggleFavorite(carId, userId) {
        const existing = await this.prisma.favorite.findUnique({
            where: {
                userId_carId: {
                    userId,
                    carId,
                },
            },
        });
        if (existing) {
            await this.prisma.favorite.delete({
                where: {
                    id: existing.id,
                },
            });
            return { success: true, isFavorite: false };
        }
        else {
            const car = await this.prisma.car.findFirst({
                where: { id: carId, isActive: true },
            });
            if (!car) {
                throw new common_1.NotFoundException('Vehículo no encontrado o inactivo.');
            }
            await this.prisma.favorite.create({
                data: {
                    userId,
                    carId,
                },
            });
            return { success: true, isFavorite: true };
        }
    }
    async getFavorites(userId) {
        const favorites = await this.prisma.favorite.findMany({
            where: { userId },
            include: {
                car: {
                    include: {
                        images: { orderBy: { isPrimary: 'desc' } },
                        seller: {
                            select: { email: true, nombre: true, apellido: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const activeFavorites = favorites.filter((f) => f.car && f.car.isActive);
        return activeFavorites.map((f) => this.formatCar(f.car));
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map
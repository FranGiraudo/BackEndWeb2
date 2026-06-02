// src/favorites/favorites.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  private formatCar(car: any) {
    const imageUrls = car.images?.map((img: any) => img.url) || [];
    const primaryImage =
      car.images?.find((img: any) => img.isPrimary)?.url ||
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

  /**
   * Agrega o quita un vehículo de la lista de favoritos de un usuario.
   */
  async toggleFavorite(carId: number, userId: number) {
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
    } else {
      // Verificar si el carro existe
      const car = await this.prisma.car.findFirst({
        where: { id: carId, isActive: true },
      });
      if (!car) {
        throw new NotFoundException('Vehículo no encontrado o inactivo.');
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

  /**
   * Obtiene la lista de favoritos del usuario autenticado.
   */
  async getFavorites(userId: number) {
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

    // Filtramos solo los favoritos que tengan autos activos
    const activeFavorites = favorites.filter((f) => f.car && f.car.isActive);

    return activeFavorites.map((f) => this.formatCar(f.car));
  }
}

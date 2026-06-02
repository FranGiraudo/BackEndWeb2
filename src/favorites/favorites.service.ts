// src/favorites/favorites.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatCar } from '../cars/car.formatter';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Agrega o quita un vehículo de la lista de favoritos de un usuario.
   */
  async toggleFavorite(carId: number, userId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_carId: { userId, carId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { success: true, isFavorite: false };
    }

    const car = await this.prisma.car.findFirst({
      where: { id: carId, isActive: true },
    });

    if (!car) {
      throw new NotFoundException('Vehículo no encontrado o inactivo.');
    }

    await this.prisma.favorite.create({ data: { userId, carId } });
    return { success: true, isFavorite: true };
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

    return favorites
      .filter((f) => f.car?.isActive)
      .map((f) => formatCar(f.car));
  }
}

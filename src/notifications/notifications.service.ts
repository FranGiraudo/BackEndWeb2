import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async createNotification(userId: number, title: string, message: string, type: 'NEW_INQUIRY' | 'PRICE_DROP') {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  }

  async notifyPriceDrop(carId: number, oldPrice: number, newPrice: number, carName: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { carId },
      select: { userId: true },
    });

    const notifications = favorites.map(fav => ({
      userId: fav.userId,
      title: 'Aviso de bajada de precio',
      message: `El vehiculo que guardaste en favoritos (${carName}) bajo su precio de $${oldPrice} a $${newPrice}.`,
      type: 'PRICE_DROP' as const,
    }));

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({
        data: notifications,
      });
    }
  }
}

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async getMyRecommendations(@Request() req) {
    const recommendation = await this.prisma.aiRecommendation.findFirst({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!recommendation || recommendation.carIds.length === 0) {
      return { cars: [] };
    }

    const cars = await this.prisma.car.findMany({
      where: { id: { in: recommendation.carIds } },
      include: { images: true },
    });

    // Mantener el orden original de la recomendacion
    const orderedCars = recommendation.carIds.map(id => cars.find(c => c.id === id)).filter(Boolean);

    return { cars: orderedCars };
  }
}

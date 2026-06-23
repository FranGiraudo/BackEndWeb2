import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(
    private prisma: PrismaService,
    private recommendationsService: RecommendationsService,
  ) {}

  @Get('me')
  async getMyRecommendations(@Request() req) {
    let recommendation = await this.prisma.aiRecommendation.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!recommendation || recommendation.carIds.length === 0) {
      recommendation = await this.recommendationsService.generateForUser(req.user.id);
    }

    if (!recommendation || recommendation.carIds.length === 0) {
      return { cars: [] };
    }

    const cars = await this.prisma.car.findMany({
      where: { id: { in: recommendation.carIds } },
      include: { images: true },
    });

    const orderedCars = recommendation.carIds.map(id => cars.find(c => c.id === id)).filter(Boolean);
    return { cars: orderedCars };
  }

  @Post('generate')
  async forceGenerate(@Request() req) {
    const recommendation = await this.recommendationsService.generateForUser(req.user.id);
    
    if (!recommendation || recommendation.carIds.length === 0) {
      return { cars: [] };
    }

    const cars = await this.prisma.car.findMany({
      where: { id: { in: recommendation.carIds } },
      include: { images: true },
    });

    const orderedCars = recommendation.carIds.map(id => cars.find(c => c.id === id)).filter(Boolean);
    return { cars: orderedCars };
  }
}

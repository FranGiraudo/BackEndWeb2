import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async generateForUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        searchHistories: { orderBy: { createdAt: 'desc' }, take: 10 },
        favorites: { include: { car: true } }
      }
    });

    let userContext = "";
    let reason = "";

    if (!user || (user.searchHistories.length === 0 && user.favorites.length === 0)) {
      // Fallback para usuarios sin historial
      userContext = "El usuario es nuevo y no tiene historial. Recomienda 3 autos populares, variados y de buena relación calidad-precio para empezar a conocer sus gustos.";
      reason = "Selección especial para vos";
    } else {
      userContext = JSON.stringify({
        recentSearches: user.searchHistories.map(sh => sh.filters || sh.queryText),
        favoriteCars: user.favorites.map(f => `${f.car.brand} ${f.car.model} (${f.car.year})`)
      });
      reason = 'Recomendado por IA según tu historial reciente';
    }

    const availableCars = await this.prisma.car.findMany({
      where: { 
        status: 'Disponible',
        auction: null
      },
      select: { id: true, brand: true, model: true, year: true, price: true, km: true }
    });

    if (availableCars.length === 0) return null;

    const catalogJson = JSON.stringify(availableCars);

    this.logger.debug(`Generando recomendacion on-demand para usuario ID ${userId}...`);

    const recommendedIds = await this.aiService.generateWeeklyRecommendations(userContext, catalogJson);

    if (recommendedIds && recommendedIds.length > 0) {
      return await this.prisma.aiRecommendation.create({
        data: {
          userId: userId,
          carIds: recommendedIds,
          score: 85,
          reason: reason
        }
      });
    }
    return null;
  }

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyRecommendations() {
    this.logger.log('Iniciando generacion semanal de recomendaciones...');

    try {
      const users = await this.prisma.user.findMany({
        where: { role: 'comprador' },
        include: {
          searchHistories: { orderBy: { createdAt: 'desc' }, take: 1 },
          favorites: { take: 1 }
        }
      });

      const activeUsers = users.filter(u => u.searchHistories.length > 0 || u.favorites.length > 0);

      for (const user of activeUsers) {
        try {
          await this.generateForUser(user.id);
        } catch (e) {
          this.logger.error(`Error generando recomendacion para el usuario ${user.id}`, e);
        }
      }

      this.logger.log('Generacion semanal de recomendaciones finalizada.');
    } catch (error) {
      this.logger.error('Error general en CronJob de recomendaciones', error);
    }
  }
}

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

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyRecommendations() {
    this.logger.log('Iniciando generacion semanal de recomendaciones...');

    try {
      // 1. Buscar compradores activos con historial o favoritos
      const users = await this.prisma.user.findMany({
        where: { role: 'comprador' },
        include: {
          searchHistories: { orderBy: { createdAt: 'desc' }, take: 10 },
          favorites: { include: { car: true } }
        }
      });

      const activeUsers = users.filter(u => u.searchHistories.length > 0 || u.favorites.length > 0);

      if (activeUsers.length === 0) {
        this.logger.log('No hay usuarios activos para recomendar.');
        return;
      }

      // 2. Obtener catalogo de autos disponibles
      const availableCars = await this.prisma.car.findMany({
        where: { status: 'disponible' },
        select: { id: true, brand: true, model: true, year: true, price: true, km: true }
      });

      if (availableCars.length === 0) {
        this.logger.log('No hay autos en el catalogo para recomendar.');
        return;
      }

      const catalogJson = JSON.stringify(availableCars);

      // 3. Iterar y pedir recomendacion a la IA para cada usuario
      for (const user of activeUsers) {
        try {
          const userContext = JSON.stringify({
            recentSearches: user.searchHistories.map(sh => sh.filters || sh.queryText),
            favoriteCars: user.favorites.map(f => `${f.car.brand} ${f.car.model} (${f.car.year})`)
          });

          this.logger.debug(`Procesando usuario ID ${user.id}...`);

          const recommendedIds = await this.aiService.generateWeeklyRecommendations(userContext, catalogJson);

          if (recommendedIds && recommendedIds.length > 0) {
            await this.prisma.aiRecommendation.create({
              data: {
                userId: user.id,
                carIds: recommendedIds,
                score: 85,
                reason: 'Recomendado por IA según tu historial'
              }
            });
          }
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

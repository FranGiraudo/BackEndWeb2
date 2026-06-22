import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CarsModule } from './cars/cars.module';
import { ImagesModule } from './images/images.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AiModule } from './ai/ai.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { SearchHistoryModule } from './search-history/search-history.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { AuctionsModule } from './auctions/auctions.module';
import { NotificationsModule } from './notifications/notifications.module';

import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 peticiones por minuto máximo por IP
    }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CarsModule,
    ImagesModule,
    InquiriesModule,
    FavoritesModule,
    AiModule,
    ReviewsModule,
    ReportsModule,
    SearchHistoryModule,
    RecommendationsModule,
    AuctionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

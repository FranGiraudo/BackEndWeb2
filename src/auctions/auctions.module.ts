import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuctionsGateway } from './auctions.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsGateway],
  exports: [AuctionsService],
})
export class AuctionsModule {}

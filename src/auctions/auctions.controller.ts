import { Body, Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/bid')
  async placeBid(
    @Param('id', ParseIntPipe) id: number,
    @Body() createBidDto: CreateBidDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return await this.auctionsService.placeBid(id, userId, createBidDto);
  }
}

import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() createReviewDto: CreateReviewDto) {
    // req.user viene del JwtStrategy (id, email, etc.)
    const reviewerId = req.user.id;
    return this.reviewsService.create(reviewerId, createReviewDto);
  }

  @Get('vendor/:id')
  findByVendor(@Param('id') id: string) {
    return this.reviewsService.findByVendor(+id);
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reviewerId: number, createReviewDto: CreateReviewDto) {
    if (reviewerId === createReviewDto.vendorId) {
      throw new BadRequestException('No puedes calificarte a ti mismo.');
    }

    return this.prisma.review.create({
      data: {
        reviewerId,
        vendorId: createReviewDto.vendorId,
        score: createReviewDto.score,
        comment: createReviewDto.comment,
      },
    });
  }

  async findByVendor(vendorId: number) {
    return this.prisma.review.findMany({
      where: { vendorId },
      include: {
        reviewer: {
          select: { id: true, nombre: true, apellido: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

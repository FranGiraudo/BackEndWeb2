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

  async getTopVendors() {
    const vendors = await this.prisma.user.findMany({
      where: { role: 'vendedor' },
      include: {
        reviewsReceived: true,
      }
    });

    const ranking = vendors.map(v => {
      const totalReviews = v.reviewsReceived.length;
      const avgScore = totalReviews > 0 
        ? v.reviewsReceived.reduce((acc, curr) => acc + curr.score, 0) / totalReviews 
        : 0;
      return {
        id: v.id,
        nombre: v.nombre,
        apellido: v.apellido,
        avatarUrl: v.avatarUrl,
        avgScore,
        totalReviews
      };
    })
    .filter(v => v.totalReviews > 0)
    .sort((a, b) => b.avgScore - a.avgScore || b.totalReviews - a.totalReviews)
    .slice(0, 5);

    return ranking;
  }
}

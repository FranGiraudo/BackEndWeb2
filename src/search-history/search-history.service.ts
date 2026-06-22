import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(userId: number) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async saveHistory(userId: number, queryText: string, filters: any) {
    return this.prisma.searchHistory.create({
      data: {
        userId,
        queryText: queryText || '',
        filters: filters || {},
      },
    });
  }
}

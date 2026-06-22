import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: number, createReportDto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        reporterId,
        carId: createReportDto.carId,
        reason: createReportDto.reason,
        description: createReportDto.description,
      },
    });
  }
}

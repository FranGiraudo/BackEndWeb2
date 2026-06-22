import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() createReportDto: CreateReportDto) {
    const reporterId = req.user.id;
    return this.reportsService.create(reporterId, createReportDto);
  }
}

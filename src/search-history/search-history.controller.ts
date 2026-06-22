import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { SearchHistoryService } from './search-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search-history')
@UseGuards(JwtAuthGuard)
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) {}

  @Get()
  getHistory(@Request() req) {
    return this.searchHistoryService.getHistory(req.user.id);
  }

  @Post()
  saveHistory(
    @Request() req,
    @Body('queryText') queryText: string,
    @Body('filters') filters: any,
  ) {
    return this.searchHistoryService.saveHistory(req.user.id, queryText, filters);
  }
}

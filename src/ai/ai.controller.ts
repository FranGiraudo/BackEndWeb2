import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  async compareVehicles(@Body() body: { cars: any[] }) {
    const recommendation = await this.aiService.compareVehicles(body.cars);
    return recommendation;
  }
}

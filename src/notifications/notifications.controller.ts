import { Controller, Get, Patch, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Request() req: any) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }
}

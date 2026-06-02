// src/inquiries/inquiries.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * InquiriesController — Sistema de mensajería entre compradores y vendedores
 *
 * POST /api/inquiries              → Enviar consulta (comprador)
 * GET  /api/inquiries/seller       → Mensajes recibidos (vendedor)
 * GET  /api/inquiries/buyer        → Mensajes enviados (comprador)
 * POST /api/inquiries/:id/reply    → Responder (vendedor o comprador)
 * PUT  /api/inquiries/:id/read     → Marcar como leído
 * DELETE /api/inquiries/:id        → Eliminar conversación
 */
@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('comprador')
  create(@Body() dto: CreateInquiryDto, @Request() req) {
    const buyerName = req.user.nombre || req.user.email;
    return this.inquiriesService.create(dto, req.user.id, buyerName);
  }

  @Get('seller')
  @UseGuards(RolesGuard)
  @Roles('vendedor')
  getSellerInquiries(@Request() req) {
    return this.inquiriesService.getSellerInquiries(req.user.id);
  }

  @Get('buyer')
  @UseGuards(RolesGuard)
  @Roles('comprador')
  getBuyerInquiries(@Request() req) {
    return this.inquiriesService.getBuyerInquiries(req.user.id);
  }

  @Post(':id/reply')
  addReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReplyDto,
    @Request() req,
  ) {
    const userName = req.user.nombre || req.user.email;
    return this.inquiriesService.addReply(
      id,
      dto,
      req.user.id,
      req.user.rol,
      userName,
    );
  }

  @Put(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.inquiriesService.markAsRead(id, req.user.id, req.user.rol);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.inquiriesService.remove(id, req.user.id);
  }
}

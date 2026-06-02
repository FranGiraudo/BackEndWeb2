// src/favorites/favorites.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * FavoritesController — Endpoint para favoritos del comprador
 *
 * POST /api/favorites/:carId → toggle favorito (comprador)
 * GET  /api/favorites        → listar favoritos (comprador)
 */
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':carId')
  @UseGuards(RolesGuard)
  @Roles('comprador')
  toggle(
    @Param('carId', ParseIntPipe) carId: number,
    @Request() req,
  ) {
    return this.favoritesService.toggleFavorite(carId, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('comprador')
  getFavorites(@Request() req) {
    return this.favoritesService.getFavorites(req.user.id);
  }
}

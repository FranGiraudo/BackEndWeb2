// src/cars/cars.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * CarsController — CRUD de vehículos
 *
 * GET    /api/cars              → Lista con filtros (público)
 * GET    /api/cars/:id          → Detalle (público)
 * POST   /api/cars              → Crear publicación (vendedor)
 * PUT    /api/cars/:id          → Editar publicación (vendedor dueño)
 * DELETE /api/cars/:id          → Eliminar publicación (vendedor dueño)
 *
 * Nota: POST /api/cars/upload-images está en ImagesController
 * pero comparte el prefijo "cars" por requisito del enunciado.
 */
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  findMyCars(@Request() req) {
    return this.carsService.findAll({ sellerId: String(req.user.id) });
  }

  @Get()
  findAll(@Query() filters: FilterCarsDto) {
    return this.carsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  create(@Body() dto: CreateCarDto, @Request() req) {
    return this.carsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarDto,
    @Request() req,
  ) {
    return this.carsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.carsService.remove(id, req.user.id);
  }
}

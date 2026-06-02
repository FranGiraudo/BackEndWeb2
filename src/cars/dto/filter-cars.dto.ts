// src/cars/dto/filter-cars.dto.ts
import { IsNumberString, IsOptional, IsString } from 'class-validator';

/**
 * FilterCarsDto — Parámetros de query para el endpoint GET /api/cars
 *
 * Todos los filtros son opcionales. Corresponden exactamente a los
 * criterios que usa el frontend en main.js (obtenerCriteriosFiltro).
 */
export class FilterCarsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumberString()
  yearMin?: string;

  @IsOptional()
  @IsNumberString()
  yearMax?: string;

  @IsOptional()
  @IsNumberString()
  priceMin?: string;

  @IsOptional()
  @IsNumberString()
  priceMax?: string;

  @IsOptional()
  @IsNumberString()
  kmMin?: string;

  @IsOptional()
  @IsNumberString()
  kmMax?: string;

  @IsOptional()
  @IsString()
  body?: string; // "all" o tipo de carrocería

  @IsOptional()
  @IsString()
  fuel?: string; // "all" o tipo de combustible

  @IsOptional()
  @IsString()
  transmission?: string; // "all" o tipo de transmisión

  @IsOptional()
  @IsNumberString()
  sellerId?: string; // Para filtrar los autos de un vendedor específico
}

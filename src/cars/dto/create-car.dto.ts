// src/cars/dto/create-car.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCarDto {
  @IsNotEmpty({ message: 'La marca es requerida.' })
  @IsString()
  brand: string;

  @IsNotEmpty({ message: 'El modelo es requerido.' })
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  year: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  km: number;

  @IsNotEmpty({ message: 'El combustible es requerido.' })
  @IsString()
  fuel: string;

  @IsNotEmpty({ message: 'La transmisión es requerida.' })
  @IsString()
  transmission: string;

  @IsNotEmpty({ message: 'La ubicación es requerida.' })
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Campos IA — vienen del endpoint upload-images previo
  @IsOptional()
  @IsString()
  bodyType?: string;

  @IsOptional()
  @IsString()
  aiStatus?: string;

  @IsOptional()
  @IsString()
  aiDamages?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  aiPriceMin?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  aiPriceMax?: number;

  // URLs de imágenes ya subidas previamente con POST /cars/upload-images
  @IsOptional()
  images?: string[];
}

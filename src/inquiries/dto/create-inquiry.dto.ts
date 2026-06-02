// src/inquiries/dto/create-inquiry.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInquiryDto {
  @IsNotEmpty({ message: 'El ID del vehículo es requerido.' })
  @IsNumber()
  @Type(() => Number)
  carId: number;

  @IsNotEmpty({ message: 'El mensaje no puede estar vacío.' })
  @IsString()
  text: string;
}

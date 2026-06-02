// src/cars/dto/update-car.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCarDto } from './create-car.dto';

/**
 * UpdateCarDto hereda todos los campos de CreateCarDto pero los hace opcionales.
 * Permite actualizar solo los campos que se necesitan.
 */
export class UpdateCarDto extends PartialType(CreateCarDto) {}

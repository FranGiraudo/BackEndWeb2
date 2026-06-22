import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @IsNotEmpty({ message: 'El ID del auto es requerido.' })
  @IsInt()
  @Type(() => Number)
  carId: number;

  @IsNotEmpty({ message: 'El motivo del reporte es requerido.' })
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}

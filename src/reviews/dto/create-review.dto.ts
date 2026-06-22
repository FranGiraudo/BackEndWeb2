import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNotEmpty({ message: 'El ID del vendedor es requerido.' })
  @IsInt()
  @Type(() => Number)
  vendorId: number;

  @IsNotEmpty({ message: 'La calificación es requerida.' })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

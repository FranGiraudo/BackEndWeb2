import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateBidDto {
  @IsNotEmpty({ message: 'El monto de la puja es requerido.' })
  @IsNumber({}, { message: 'El monto de la puja debe ser un numero.' })
  @IsPositive({ message: 'El monto de la puja debe ser un numero positivo.' })
  amount: number;
}

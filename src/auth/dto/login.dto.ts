// src/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  @IsString()
  password: string;
}

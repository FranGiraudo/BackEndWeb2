// src/auth/dto/register.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum UserRole {
  comprador = 'comprador',
  vendedor = 'vendedor',
}

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es requerido.' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es requerido.' })
  @IsString()
  apellido: string;

  @IsNotEmpty({ message: 'El DNI es requerido.' })
  @IsString()
  dni: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsEnum(UserRole, { message: 'El rol debe ser "comprador" o "vendedor".' })
  rol: UserRole;
}

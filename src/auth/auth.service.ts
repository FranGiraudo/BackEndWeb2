// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * POST /auth/register
   * Crea un nuevo usuario en la DB.
   * Responde con la misma estructura que espera el frontend:
   * { success: true, user: { email, rol, nombre } }
   */
  async register(dto: RegisterDto) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Este email ya se encuentra registrado.');
    }

    // Verificar si el DNI ya existe
    const existingDni = await this.prisma.user.findUnique({
      where: { dni: dto.dni },
    });

    if (existingDni) {
      throw new BadRequestException('Este DNI ya se encuentra registrado.');
    }

    // Hash de la contraseña con bcrypt (12 rondas de salt)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        dni: dto.dni,
        telefono: dto.telefono,
        direccion: dto.direccion,
        email: dto.email,
        passwordHash,
        rol: dto.rol as any,
      },
    });

    return {
      success: true,
      user: {
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
      },
    };
  }

  /**
   * POST /auth/login
   * Valida credenciales y devuelve un JWT + datos del usuario.
   * Responde con: { access_token, user: { email, role, nombre } }
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    }

    // Crear payload del JWT
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      success: true,
      access_token,
      user: {
        email: user.email,
        role: user.rol,   // "role" para compatibilidad exacta con el frontend
        rol: user.rol,    // "rol" también, para consistencia con el mock
        nombre: user.nombre,
        loggedAt: new Date().getTime(),
      },
    };
  }

  /**
   * GET /auth/me
   * Devuelve la información del usuario autenticado (útil para el frontend).
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        telefono: true,
        direccion: true,
        createdAt: true,
      },
    });
    return user;
  }
}

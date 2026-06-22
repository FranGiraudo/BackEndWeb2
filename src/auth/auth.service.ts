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

    // Verificación de DNI eliminada

    // Hash de la contraseña con bcrypt (12 rondas de salt)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        
        
        email: dto.email,
        password: passwordHash,
        role: dto.rol as any,
      },
    });

    return {
      success: true,
      user: {
        email: user.email,
        rol: user.role,
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    }

    // Crear payload del JWT
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      success: true,
      access_token,
      user: {
        email: user.email,
        role: user.role,   // "role" para compatibilidad exacta con el frontend
        rol: user.role,    // "rol" también, para consistencia con el mock
        nombre: user.nombre,
        avatarUrl: user.avatarUrl,
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
        role: true,
        
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (user && user.role === 'vendedor') {
      const reviewAgg = await this.prisma.review.aggregate({
        where: { vendorId: userId },
        _avg: { score: true },
        _count: { score: true },
      });
      return {
        ...user,
        ratingAverage: reviewAgg._avg.score ? Number(reviewAgg._avg.score.toFixed(1)) : 0,
        totalReviews: reviewAgg._count.score,
      };
    }

    return user;
  }

  /**
   * PUT /auth/me
   * Actualiza el perfil del usuario autenticado
   */
  async updateProfile(userId: number, data: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
        nombre: data.nombre !== undefined ? data.nombre : undefined,
        apellido: data.apellido !== undefined ? data.apellido : undefined,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        role: true,
        
        avatarUrl: true,
        createdAt: true,
      },
    });
    return { success: true, user };
  }
}

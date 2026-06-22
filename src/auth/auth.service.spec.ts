import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('debe estar definido', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('debe arrojar BadRequestException si el email ya existe', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ id: 1, email: 'test@test.com' } as any);

      await expect(
        authService.register({
          nombre: 'Test',
          apellido: 'User',
          email: 'test@test.com',
          password: 'Password123',
          rol: 'comprador',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe encriptar la contraseña y crear el usuario si el email no existe', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      const createSpy = jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: 1,
        email: 'new@test.com',
        role: 'comprador',
        nombre: 'Nuevo',
        apellido: 'Usuario'
      } as any);

      const result = await authService.register({
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'new@test.com',
        password: 'Password123',
        rol: 'comprador',
      });

      expect(result.success).toBe(true);
      expect(createSpy).toHaveBeenCalled();
      
      const callArgs = createSpy.mock.calls[0][0];
      // Verificar que la contraseña guardada no sea texto plano
      expect(callArgs.data.password).not.toBe('Password123');
      const isMatch = await bcrypt.compare('Password123', callArgs.data.password);
      expect(isMatch).toBe(true);
    });
  });
});

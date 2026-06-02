// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/roles.guard';

/**
 * Decorador @Roles('vendedor') para marcar rutas con restricción de rol.
 * Ejemplo de uso:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('vendedor')
 *   @Post('/cars')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

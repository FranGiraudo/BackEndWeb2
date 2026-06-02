import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        user: {
            email: string;
            rol: import("@prisma/client").$Enums.Role;
            nombre: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        success: boolean;
        access_token: string;
        user: {
            email: string;
            role: import("@prisma/client").$Enums.Role;
            rol: import("@prisma/client").$Enums.Role;
            nombre: string;
            loggedAt: number;
        };
    }>;
    getProfile(userId: number): Promise<{
        nombre: string;
        apellido: string;
        telefono: string | null;
        direccion: string | null;
        email: string;
        rol: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        id: number;
    } | null>;
}

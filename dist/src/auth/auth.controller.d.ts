import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): Promise<{
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

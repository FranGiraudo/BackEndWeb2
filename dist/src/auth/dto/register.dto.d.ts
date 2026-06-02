export declare enum UserRole {
    comprador = "comprador",
    vendedor = "vendedor"
}
export declare class RegisterDto {
    nombre: string;
    apellido: string;
    dni: string;
    telefono?: string;
    direccion?: string;
    email: string;
    password: string;
    rol: UserRole;
}

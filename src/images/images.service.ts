// src/images/images.service.ts
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class ImagesService {
  /**
   * Verifica que el directorio /uploads exista y lo crea si no.
   */
  ensureUploadsDir(): void {
    const uploadsPath = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsPath)) {
      mkdirSync(uploadsPath, { recursive: true });
    }
  }

  /**
   * Construye la URL pública completa de una imagen subida.
   * @param filename - Nombre del archivo (ej: "1717300000000-foto.webp")
   * @returns URL completa (ej: "http://localhost:3000/uploads/1717300000000-foto.webp")
   */
  buildImageUrl(filename: string): string {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${appUrl}/uploads/${filename}`;
  }
}

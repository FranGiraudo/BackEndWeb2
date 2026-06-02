// src/images/images.service.ts
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class ImagesService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Convierte un buffer de imagen a WebP con calidad 82 y sube a Cloudinary.
   * Devuelve la URL segura (https) del asset subido.
   */
  async convertAndUpload(buffer: Buffer): Promise<string> {
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 82 })
      .toBuffer();

    const result = await this.cloudinaryService.uploadBuffer(webpBuffer);
    return result.secure_url;
  }
}

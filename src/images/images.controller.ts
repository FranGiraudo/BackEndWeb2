// src/images/images.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AiService } from '../ai/ai.service';
import { ImagesService } from './images.service';

/**
 * ImagesController — Endpoint para subida de imágenes con análisis IA
 *
 * POST /api/cars/upload-images
 * - Requiere JWT + rol vendedor
 * - Recibe archivos como multipart/form-data (campo "images")
 * - Guarda los archivos en /uploads con nombre único (timestamp-original)
 * - Llama al AiService para analizar el vehículo
 * - Devuelve URLs + análisis IA
 */
@Controller('cars')
export class ImagesController {
  constructor(
    private readonly aiService: AiService,
    private readonly imagesService: ImagesService,
  ) {}

  @Post('upload-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, callback) => {
          // Nombre único: timestamp + nombre original sanitizado
          const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Solo aceptamos imágenes
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Solo se permiten imágenes (jpeg, png, webp, gif).',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB por archivo
      },
    }),
  )
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('brand') brand: string = '',
    @Query('model') model: string = '',
    @Query('price') price: string = '10000',
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debés subir al menos una imagen.');
    }

    // Construir URLs públicas de las imágenes guardadas
    const imageUrls = files.map((file) =>
      this.imagesService.buildImageUrl(file.filename),
    );

    // Análisis IA de las imágenes
    const aiAnalysis = this.aiService.analyzeVehicle(
      brand,
      model,
      parseFloat(price) || 10000,
      files.length,
    );

    /**
     * Respuesta compatible con el frontend (publish.js):
     * El frontend muestra:
     * - carroceriaDetectada → bodyType
     * - estadoGeneralIA → aiStatus
     * - danosVisiblesIA → aiDamages
     * - rangoPrecioIA → { min, max }
     * - fotosCargadas → images (array de URLs)
     */
    return {
      success: true,
      images: imageUrls,
      primaryImage: imageUrls[0],
      aiAnalysis: {
        bodyType: aiAnalysis.bodyType,
        aiStatus: aiAnalysis.aiStatus,
        aiDamages: aiAnalysis.aiDamages,
        priceRange: {
          min: aiAnalysis.aiPriceMin,
          max: aiAnalysis.aiPriceMax,
        },
      },
    };
  }
}

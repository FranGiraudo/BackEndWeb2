// src/images/images.controller.ts
import {
  BadRequestException,
  Controller,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AiService } from '../ai/ai.service';
import { ImagesService } from './images.service';

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
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Solo se permiten imágenes (jpeg, png, webp, gif).'),
            false,
          );
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('brand') brand: string = '',
    @Query('model') model: string = '',
    @Query('price') price: string = '10000',
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debés subir al menos una imagen.');
    }

    // Convertir cada imagen a WebP y subir a Cloudinary en paralelo
    const imageUrls = await Promise.all(
      files.map((file) => this.imagesService.convertAndUpload(file.buffer)),
    );

    const aiAnalysis = this.aiService.analyzeVehicle(
      brand,
      model,
      parseFloat(price) || 10000,
      files.length,
    );

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

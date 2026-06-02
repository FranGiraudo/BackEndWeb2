// src/images/images.module.ts
import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CloudinaryService } from './cloudinary.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ImagesController],
  providers: [ImagesService, CloudinaryService],
  exports: [ImagesService],
})
export class ImagesModule {}

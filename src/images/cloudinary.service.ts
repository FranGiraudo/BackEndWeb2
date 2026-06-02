// src/images/cloudinary.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  uploadBuffer(buffer: Buffer, folder = 'smartauto'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', format: 'webp' },
        (error, result) => {
          if (error || !result) return reject(error ?? new InternalServerErrorException('Cloudinary error'));
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }
}

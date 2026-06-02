import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { join } from 'path';
import { ImagesService } from './images/images.service';

async function bootstrap() {
  const application = await NestFactory.create(AppModule);

  // Habilitar CORS para los orígenes del frontend (Live Server y puerto por defecto)
  application.enableCors({
    origin: true, // origin: true refleja dinámicamente el origen de la petición, permitiendo cualquier puerto
    credentials: true,
  });

  // Configurar prefijo global para la API
  application.setGlobalPrefix('api');

  // Configurar pipe global de validación
  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Servir archivos de /uploads de forma estática bajo la ruta /uploads
  application.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Asegurar que el directorio de subidas exista al arrancar
  const imagesService = application.get(ImagesService);
  imagesService.ensureUploadsDir();

  const port = process.env.PORT ?? 3000;
  await application.listen(port);
  console.log(`SmartAuto API escuchando en el puerto ${port}`);
}
bootstrap();

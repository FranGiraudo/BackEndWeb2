import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const application = await NestFactory.create(AppModule);

  application.enableCors({
    origin: true,
    credentials: true,
  });

  application.setGlobalPrefix('api');

  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await application.listen(port);
  console.log(`SmartAuto API escuchando en el puerto ${port}`);
}
bootstrap();

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);

  app.setGlobalPrefix('api/v1', {
    exclude: ['healthz'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: configService.get('CORS_ORIGIN')?.split(',') ?? '*',
    credentials: true,
  });

  await app.listen(port);
  const address = await app.getUrl();
  Logger.log(`🚀 Dropo API listening on ${address}`, 'Bootstrap');
}

void bootstrap();

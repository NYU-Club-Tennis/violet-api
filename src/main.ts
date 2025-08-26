import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './constants/environment.constant';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Violet API')
    .setDescription('The API for NYU club tennis')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: '/docs/json' });

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.enableCors({
    origin: [
      'https://nyuclubtennis-dev.vercel.app',
      'https://nyuclubtennis.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: 'GET,PUT,PATCH,POST,DELETE',
    exposedHeaders: ['Content-Disposition', 'Retry-After'],
    credentials: true,
  });

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(env.port);
}
bootstrap();

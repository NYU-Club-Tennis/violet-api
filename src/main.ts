import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './constants/environment.constant';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';

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
    methods: 'GET,PUT,PATCH,POST,DELETE',
    exposedHeaders: ['Content-Disposition', 'Retry-After'],
  });
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(env.port);
}
bootstrap();

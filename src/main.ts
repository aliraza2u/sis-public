import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.enableCors();
  app.use(helmet());

  // Static Assets
  const uploadDir = configService.get<string>('upload.uploadDir') || './uploads';
  app.useStaticAssets(join(process.cwd(), uploadDir), {
    prefix: '/uploads',
  });

  // Global Prefix & Versioning
  const prefix = configService.get<string>('app.prefix') ?? 'api';
  app.setGlobalPrefix(prefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  if (configService.get<boolean>('swagger.enabled')) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title') ?? 'SIS API')
      .setDescription(configService.get<string>('swagger.description') ?? 'API Documentation')
      .setVersion(configService.get<string>('swagger.version') ?? '1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(configService.get<string>('swagger.path') ?? 'api/docs', app, document);
  }

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(
    `Swagger UI available at: ${await app.getUrl()}/${configService.get<string>('swagger.path')}`,
  );
}
void bootstrap();

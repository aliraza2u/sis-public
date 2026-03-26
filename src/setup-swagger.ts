import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication, configService: ConfigService) {
  if (configService.get<boolean>('swagger.enabled')) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title') ?? 'SIS API')
      .setDescription(configService.get<string>('swagger.description') ?? 'API Documentation for Student Information System')
      .setVersion(configService.get<string>('swagger.version') ?? '1.0')
      .addBearerAuth()
      // Proper way to add a global header in Swagger 11+
      .addGlobalParameters({
        in: 'header',
        name: 'x-tenant-id',
        required: false,
        description: 'Tenant Slug (e.g. al-mkki)',
        schema: { type: 'string' },
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(configService.get<string>('swagger.path') ?? 'api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}

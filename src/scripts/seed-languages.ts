import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const logger = console;

  logger.log('--- Starting Language Seeding ---');

  const languages = [
    { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
    { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
  ];

  for (const lang of languages) {
    await prisma.supportedLanguage.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
    logger.log(`Upserted language: ${lang.code}`);
  }

  logger.log('--- Seeding Completed Successfully ---');
  await app.close();
}

bootstrap();

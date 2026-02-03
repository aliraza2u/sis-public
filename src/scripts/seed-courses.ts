import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CourseService } from '../modules/course/course.service';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const courseService = app.get(CourseService);
  const cls = app.get(ClsService);
  const prisma = app.get(PrismaService);
  const logger = console;

  logger.log('--- Starting Course Seeding ---');

  await cls.run(async () => {
    // 1. Ensure Dependencies (Languages, Tenant, User)
    await prisma.supportedLanguage.upsert({
      where: { code: 'ar' },
      update: {},
      create: { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
    });
    await prisma.supportedLanguage.upsert({
      where: { code: 'en' },
      update: {},
      create: { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
    });

    // Check for existing tenant or create one
    let tenant = await prisma.tenant.findFirst({ where: { slug: 'seed-tenant' } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: { en: 'Seed Tenant' },
          slug: 'seed-tenant',
          contactEmail: 'seed@example.com',
          defaultLanguageCode: 'en',
        },
      });
      logger.log(`Created Tenant: ${tenant.slug}`);
    } else {
      logger.log(`Using existing Tenant: ${tenant.slug}`);
    }

    // Check for existing user or create one
    let user = await prisma.user.findFirst({ where: { email: 'seed-creator@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'seed-creator@example.com',
          passwordHash: 'dummy', // Not for login
          tenantId: tenant.id,
          role: 'admin',
          firstName: { en: 'Seed' },
          lastName: { en: 'Creator' },
          emailVerified: true,
        },
      });
      logger.log(`Created Creator User: ${user.email}`);
    } else {
      logger.log(`Using existing Creator User: ${user.email}`);
    }

    // Set Context
    cls.set('tenantId', tenant.id);
    cls.set('userId', user.id);
    cls.set('tenant', tenant);
    cls.set('user', user);

    // 2. Define Dummy Courses
    const courses = [
      {
        title: { en: 'Introduction to Computer Science', ar: 'مقدمة في علوم الحاسب' },
        description: {
          en: 'A comprehensive introduction to the fundamentals of computer science.',
        },
        shortDescription: { en: 'CS Fundamentals' },
        category: 'Computer Science',
        level: 'beginner',
        durationWeeks: 12,
        thumbnailUrl: 'https://placehold.co/600x400/png?text=CS+101',
        isPublished: true,
        isActive: true,
      },
      {
        title: { en: 'Advanced Web Development', ar: 'تطوير الويب المتقدم' },
        description: { en: 'Master modern web technologies including React, NestJS, and more.' },
        shortDescription: { en: 'Modern Web Stack' },
        category: 'Software Engineering',
        level: 'advanced',
        durationWeeks: 16,
        thumbnailUrl: 'https://placehold.co/600x400/png?text=Web+Dev',
        isPublished: true,
        isActive: true,
      },
      {
        title: { en: 'Data Science Bootcamp', ar: 'معسكر علم البيانات' },
        description: {
          en: 'Intensive bootcamp covering Python, Pandas, and Machine Learning basics.',
        },
        shortDescription: { en: 'Data Science' },
        category: 'Data Science',
        level: 'intermediate',
        durationWeeks: 10,
        thumbnailUrl: 'https://placehold.co/600x400/png?text=Data+Science',
        isPublished: false,
        isActive: true, // Draft
      },
    ];

    // 3. Insert Courses
    for (const courseData of courses) {
      // Check if title already exists to avoid duplicates
      // Note: JSON filtering is tricky in raw prisma, so careful.
      // For simplicity, we just create. You might want to deleteMany first if re-seeding consistently.

      const created = await courseService.create(courseData as any);
      logger.log(`Created Course: ${created.id} - ${JSON.stringify(courseData.title)}`);
    }

    logger.log('--- Seeding Completed Successfully ---');
  });

  await app.close();
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { UserRole, Tenant } from '@/infrastructure/prisma/client/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const logger = console;

  logger.log('--- Starting Tenant and User Seeding ---');

  // 0. Ensure Languages are seeded first (required for tenant defaultLanguageCode)
  logger.log('\n--- Ensuring Languages are Seeded ---');
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
    logger.log(`Ensured language exists: ${lang.code}`);
  }

  // Default password for seeded users
  const defaultPassword = 'Password123!';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  // 1. Seed Tenants
  logger.log('\n--- Seeding Tenants ---');
  const tenants = [
    {
      name: { en: 'Al-Makki Institute', ar: 'معهد المكي' },
      slug: 'al-makki-institute',
      alias: 'AM',
      contactEmail: 'contact@almakki.edu',
      contactPhone: '+966500000000',
      address: {
        en: {
          street: '123 Education Street',
          city: 'Riyadh',
          state: 'Riyadh Province',
          postalCode: '12345',
          country: 'Saudi Arabia',
        },
        ar: {
          street: 'شارع التعليم 123',
          city: 'الرياض',
          state: 'منطقة الرياض',
          postalCode: '12345',
          country: 'المملكة العربية السعودية',
        },
      },
      website: 'https://almakki.edu',
      defaultLanguageCode: 'ar',
      enabledLanguages: ['en', 'ar'],
      timezone: 'Asia/Riyadh',
      isActive: true,
    },
    {
      name: { en: 'Test Academy', ar: 'أكاديمية الاختبار' },
      slug: 'test-academy',
      alias: 'TA',
      contactEmail: 'contact@testacademy.edu',
      contactPhone: '+966500000001',
      address: {
        en: {
          street: '456 Test Avenue',
          city: 'Jeddah',
          state: 'Makkah Province',
          postalCode: '21421',
          country: 'Saudi Arabia',
        },
        ar: {
          street: 'جادة الاختبار 456',
          city: 'جدة',
          state: 'منطقة مكة المكرمة',
          postalCode: '21421',
          country: 'المملكة العربية السعودية',
        },
      },
      website: 'https://testacademy.edu',
      defaultLanguageCode: 'en',
      enabledLanguages: ['en', 'ar'],
      timezone: 'Asia/Riyadh',
      isActive: true,
    },
  ];

  const seededTenants: Tenant[] = [];
  for (const tenantData of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantData.slug },
      update: tenantData,
      create: tenantData,
    });
    seededTenants.push(tenant);
    logger.log(`Upserted tenant: ${tenantData.slug} (${tenant.id})`);
  }

  // 2. Seed Users
  logger.log('\n--- Seeding Users ---');
  const users = [
    // Super Admin (no tenant - global admin)
    {
      email: 'superadmin@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Super', ar: 'سوبر' },
      lastName: { en: 'Admin', ar: 'مدير' },
      phone: '+966500000010',
      roles: [UserRole.super_admin],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'en',
      isActive: true,
      tenantId: seededTenants[0].id, // Still needs a tenant for multi-tenant extension
    },
    // Admin for first tenant
    {
      email: 'admin@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Admin', ar: 'مدير' },
      lastName: { en: 'User', ar: 'مستخدم' },
      phone: '+966500000011',
      roles: [UserRole.admin],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'ar',
      isActive: true,
      tenantId: seededTenants[0].id,
    },
    // Reviewer for first tenant
    {
      email: 'reviewer@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Reviewer', ar: 'مراجع' },
      lastName: { en: 'User', ar: 'مستخدم' },
      phone: '+966500000012',
      roles: [UserRole.reviewer],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'ar',
      isActive: true,
      tenantId: seededTenants[0].id,
    },
    // Student for first tenant
    {
      email: 'student@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Student', ar: 'طالب' },
      lastName: { en: 'One', ar: 'واحد' },
      phone: '+966500000013',
      roles: [UserRole.student],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'ar',
      isActive: true,
      tenantId: seededTenants[0].id,
    },
    // Admin for second tenant
    {
      email: 'admin@testacademy.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Admin', ar: 'مدير' },
      lastName: { en: 'Two', ar: 'اثنان' },
      phone: '+966500000020',
      roles: [UserRole.admin],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'en',
      isActive: true,
      tenantId: seededTenants[1].id,
    },
    // Student for second tenant
    {
      email: 'student@testacademy.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Student', ar: 'طالب' },
      lastName: { en: 'Two', ar: 'اثنان' },
      phone: '+966500000021',
      roles: [UserRole.student],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'en',
      isActive: true,
      tenantId: seededTenants[1].id,
    },
  ];

  for (const userData of users) {
    try {
      const user = await prisma.user.upsert({
        where: {
          tenantId_email: {
            tenantId: userData.tenantId,
            email: userData.email,
          },
        },
        update: userData,
        create: userData,
      });
      logger.log(`Upserted user: ${userData.email} (${user.id})`);
    } catch (error) {
      logger.error(`Failed to upsert user ${userData.email}:`, error.message);
    }
  }

  logger.log('\n--- Seeding Completed Successfully ---');
  logger.log(`\nDefault password for all users: ${defaultPassword}`);
  logger.log('\nSeeded Users:');
  users.forEach((u) => {
    logger.log(`  - ${u.email} (${u.roles.join(', ')}) - Tenant: ${u.tenantId}`);
  });

  await app.close();
}

bootstrap().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});


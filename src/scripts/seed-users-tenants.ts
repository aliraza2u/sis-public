import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { UserRole, Tenant, Gender, UserProfileStatus, User } from '@/infrastructure/prisma/client/client';
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
    // Students for first tenant
    {
      email: 'student1@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Ahmed', ar: 'أحمد' },
      lastName: { en: 'Al-Saud', ar: 'السعود' },
      phone: '+966501234567',
      roles: [UserRole.student],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'ar',
      isActive: true,
      tenantId: seededTenants[0].id,
    },
    {
      email: 'student2@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Fatima', ar: 'فاطمة' },
      lastName: { en: 'Al-Rashid', ar: 'الرشيد' },
      phone: '+966502345678',
      roles: [UserRole.student],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'ar',
      isActive: true,
      tenantId: seededTenants[0].id,
    },
    {
      email: 'student3@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Mohammed', ar: 'محمد' },
      lastName: { en: 'Al-Otaibi', ar: 'العتيبي' },
      phone: '+966503456789',
      roles: [UserRole.student],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'ar',
      isActive: true,
      tenantId: seededTenants[0].id,
    },
    {
      email: 'student4@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Sara', ar: 'سارة' },
      lastName: { en: 'Al-Zahrani', ar: 'الزهراني' },
      phone: '+966504567890',
      roles: [UserRole.student],
      emailVerified: true,
      isPasswordCreated: true,
      preferredLanguageCode: 'ar',
      isActive: true,
      tenantId: seededTenants[0].id,
    },
    {
      email: 'student5@almakki.edu',
      passwordHash: hashedPassword,
      firstName: { en: 'Khalid', ar: 'خالد' },
      lastName: { en: 'Al-Mutairi', ar: 'المطيري' },
      phone: '+966505678901',
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

  const seededUsers: User[] = [];
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
      seededUsers.push(user);
      logger.log(`Upserted user: ${userData.email} (${user.id})`);
    } catch (error) {
      logger.error(`Failed to upsert user ${userData.email}:`, error.message);
    }
  }

  // 3. Seed User Profiles for Students
  logger.log('\n--- Seeding User Profiles for Students ---');
  const studentUsers = seededUsers.filter((u) => u.roles.includes(UserRole.student));
  const studentProfiles = [
    {
      userId: studentUsers[0]?.id,
      tenantId: seededTenants[0].id,
      dateOfBirth: new Date('2005-03-15'),
      gender: Gender.male,
      nationality: 'Saudi Arabia',
      nationalId: '1050315001',
      passportNo: 'A12345678',
      status: UserProfileStatus.active,
      address: {
        street: { en: 'King Fahd Road 123', ar: 'طريق الملك فهد 123' },
        city: { en: 'Riyadh', ar: 'الرياض' },
        state: { en: 'Riyadh Province', ar: 'منطقة الرياض' },
        postalCode: '11564',
        country: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
      },
      guardian: {
        firstName: { en: 'Abdullah', ar: 'عبدالله' },
        lastName: { en: 'Al-Saud', ar: 'السعود' },
        relationship: { en: 'Father', ar: 'أب' },
        phone: '+966501111111',
        email: 'guardian1@example.com',
        profession: { en: 'Engineer', ar: 'مهندس' },
      },
      education: [
        {
          previousSchool: { en: 'Al-Noor High School', ar: 'مدرسة النور الثانوية' },
          lastGradeCompleted: { en: '12th Grade', ar: 'الصف الثاني عشر' },
          yearOfCompletion: 2023,
          percentage: 92.5,
        },
      ],
    },
    {
      userId: studentUsers[1]?.id,
      tenantId: seededTenants[0].id,
      dateOfBirth: new Date('2006-07-20'),
      gender: Gender.female,
      nationality: 'Saudi Arabia',
      nationalId: '1060720002',
      passportNo: 'B23456789',
      status: UserProfileStatus.active,
      address: {
        street: { en: 'Olaya Street 456', ar: 'شارع العليا 456' },
        city: { en: 'Riyadh', ar: 'الرياض' },
        state: { en: 'Riyadh Province', ar: 'منطقة الرياض' },
        postalCode: '12211',
        country: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
      },
      guardian: {
        firstName: { en: 'Ibrahim', ar: 'إبراهيم' },
        lastName: { en: 'Al-Rashid', ar: 'الرشيد' },
        relationship: { en: 'Father', ar: 'أب' },
        phone: '+966502222222',
        email: 'guardian2@example.com',
        profession: { en: 'Doctor', ar: 'طبيب' },
      },
      education: [
        {
          previousSchool: { en: 'Al-Huda Girls School', ar: 'مدرسة الهدى للبنات' },
          lastGradeCompleted: { en: '12th Grade', ar: 'الصف الثاني عشر' },
          yearOfCompletion: 2024,
          percentage: 95.0,
        },
      ],
    },
    {
      userId: studentUsers[2]?.id,
      tenantId: seededTenants[0].id,
      dateOfBirth: new Date('2005-11-10'),
      gender: Gender.male,
      nationality: 'Saudi Arabia',
      nationalId: '1051110003',
      passportNo: 'C34567890',
      status: UserProfileStatus.active,
      address: {
        street: { en: 'Prince Sultan Road 789', ar: 'طريق الأمير سلطان 789' },
        city: { en: 'Riyadh', ar: 'الرياض' },
        state: { en: 'Riyadh Province', ar: 'منطقة الرياض' },
        postalCode: '11564',
        country: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
      },
      guardian: {
        firstName: { en: 'Omar', ar: 'عمر' },
        lastName: { en: 'Al-Otaibi', ar: 'العتيبي' },
        relationship: { en: 'Father', ar: 'أب' },
        phone: '+966503333333',
        email: 'guardian3@example.com',
        profession: { en: 'Teacher', ar: 'معلم' },
      },
      education: [
        {
          previousSchool: { en: 'Al-Falah School', ar: 'مدرسة الفلاح' },
          lastGradeCompleted: { en: '12th Grade', ar: 'الصف الثاني عشر' },
          yearOfCompletion: 2023,
          percentage: 88.5,
        },
      ],
    },
    {
      userId: studentUsers[3]?.id,
      tenantId: seededTenants[0].id,
      dateOfBirth: new Date('2006-02-28'),
      gender: Gender.female,
      nationality: 'Saudi Arabia',
      nationalId: '1060228004',
      passportNo: 'D45678901',
      status: UserProfileStatus.active,
      address: {
        street: { en: 'Tahlia Street 321', ar: 'شارع التحلية 321' },
        city: { en: 'Riyadh', ar: 'الرياض' },
        state: { en: 'Riyadh Province', ar: 'منطقة الرياض' },
        postalCode: '12211',
        country: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
      },
      guardian: {
        firstName: { en: 'Hassan', ar: 'حسان' },
        lastName: { en: 'Al-Zahrani', ar: 'الزهراني' },
        relationship: { en: 'Father', ar: 'أب' },
        phone: '+966504444444',
        email: 'guardian4@example.com',
        profession: { en: 'Businessman', ar: 'رجل أعمال' },
      },
      education: [
        {
          previousSchool: { en: 'Al-Amal School', ar: 'مدرسة الأمل' },
          lastGradeCompleted: { en: '12th Grade', ar: 'الصف الثاني عشر' },
          yearOfCompletion: 2024,
          percentage: 90.0,
        },
      ],
    },
    {
      userId: studentUsers[4]?.id,
      tenantId: seededTenants[0].id,
      dateOfBirth: new Date('2005-09-05'),
      gender: Gender.male,
      nationality: 'Saudi Arabia',
      nationalId: '1050905005',
      passportNo: 'E56789012',
      status: UserProfileStatus.active,
      address: {
        street: { en: 'King Abdulaziz Road 654', ar: 'طريق الملك عبدالعزيز 654' },
        city: { en: 'Riyadh', ar: 'الرياض' },
        state: { en: 'Riyadh Province', ar: 'منطقة الرياض' },
        postalCode: '11564',
        country: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
      },
      guardian: {
        firstName: { en: 'Yusuf', ar: 'يوسف' },
        lastName: { en: 'Al-Mutairi', ar: 'المطيري' },
        relationship: { en: 'Father', ar: 'أب' },
        phone: '+966505555555',
        email: 'guardian5@example.com',
        profession: { en: 'Accountant', ar: 'محاسب' },
      },
      education: [
        {
          previousSchool: { en: 'Al-Manar School', ar: 'مدرسة المنار' },
          lastGradeCompleted: { en: '12th Grade', ar: 'الصف الثاني عشر' },
          yearOfCompletion: 2023,
          percentage: 87.5,
        },
      ],
    },
  ];

  for (const profileData of studentProfiles) {
    if (!profileData.userId) {
      logger.warn(`Skipping profile - user not found`);
      continue;
    }

    try {
      const profile = await prisma.userProfile.upsert({
        where: { userId: profileData.userId },
        update: profileData,
        create: profileData,
      });
      logger.log(`Upserted profile for user: ${profileData.userId} (${profile.id})`);
    } catch (error) {
      logger.error(`Failed to upsert profile for user ${profileData.userId}:`, error.message);
    }
  }

  logger.log('\n--- Seeding Completed Successfully ---');
  logger.log(`\nDefault password for all users: ${defaultPassword}`);
  logger.log('\nSeeded Users:');
  users.forEach((u) => {
    logger.log(`  - ${u.email} (${u.roles.join(', ')}) - Tenant: ${u.tenantId}`);
  });
  logger.log(`\nSeeded ${studentProfiles.length} student profiles`);

  await app.close();
}

bootstrap().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});


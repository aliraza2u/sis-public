import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../infrastructure/prisma/client/client';
import { UserRole } from '../common/enums/roles.enum';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding Dummy Users ---');

  const tenantSlug = process.env.DEFAULT_TENANT_SLUG || 'al-mkki';

  try {
    // 1. Ensure Languages exist
    const languages = [
      { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
      { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
    ];

    for (const lang of languages) {
      await prisma.supportedLanguage.upsert({
        where: { code: lang.code },
        update: {},
        create: lang,
      });
    }

    // 2. Ensure Tenant exists
    let tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.log(`Tenant '${tenantSlug}' not found. Creating default tenant...`);
      tenant = await prisma.tenant.create({
        data: {
          name: { en: 'Default Tenant', ar: 'الجهة الافتراضية' },
          slug: tenantSlug,
          contactEmail: `admin@${tenantSlug}.com`,
          defaultLanguageCode: 'ar',
          enabledLanguages: ['en', 'ar'],
          alias: 'DT',
        },
      });
    }

    // 3. Dummy Users Data
    const dummyUsers = [
      {
        email: 'admin-dummy@example.com',
        firstName: { en: 'Admin', ar: 'مدير' },
        lastName: { en: 'Dummy', ar: 'وهمي' },
        role: UserRole.ADMIN,
      },
      {
        email: 'reviewer-dummy@example.com',
        firstName: { en: 'Reviewer', ar: 'مراجع' },
        lastName: { en: 'Dummy', ar: 'وهمي' },
        role: UserRole.REVIEWER,
      },
      {
        email: 'applicant-dummy@example.com',
        firstName: { en: 'Applicant', ar: 'متقدم' },
        lastName: { en: 'Dummy', ar: 'وهمي' },
        role: UserRole.APPLICANT,
      },
    ];

    for (const data of dummyUsers) {
      const existingUser = await prisma.user.findFirst({
        where: { email: data.email },
      });

      if (existingUser) {
        console.log(`User ${data.email} already exists. Skipping.`);
        continue;
      }

      const user = await prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          tenantId: tenant.id,
          emailVerified: true,
          passwordHash: null,
          phone: '+0000000000',
        },
      });

      console.log(`✅ Created ${data.role} user: ${user.email}`);
    }

    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

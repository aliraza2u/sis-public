import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../infrastructure/prisma/client/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // 1. Seed Supported Languages
  const languages = [
    { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
    { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
  ];

  for (const lang of languages) {
    const upserted = await prisma.supportedLanguage.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
    console.log(`Upserted language: ${upserted.code}`);
  }

  // 2. Seed Tenant
  const tenantSlug = 'al-mkki';

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (existingTenant) {
    console.log(`Tenant already exists: ${existingTenant.id} (${existingTenant.slug})`);
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: { en: 'Al-Mkki Ed-Tech', ar: 'منصة مكي التعليمية' },
      slug: tenantSlug,
      contactEmail: 'contact@almkki.com',
      defaultLanguageCode: 'ar',
      enabledLanguages: ['en', 'ar'],
    },
  });

  console.log(`Created Tenant: ${tenant.id}`);
  console.log(`Slug: ${tenant.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

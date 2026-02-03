import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../infrastructure/prisma/client/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import { UserRole } from '../common/enums/roles.enum';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

let rl: readline.Interface | null = null;

function getRl(): readline.Interface {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    getRl().question(question, (answer) => resolve(answer));
  });
}

async function main() {
  console.log('--- Create Admin User ---');

  try {
    // Check if running in non-interactive mode (CI/CD)
    const isNonInteractive = process.env.CI === 'true' || process.env.NON_INTERACTIVE === 'true';

    // Read from environment variables
    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD?.trim();
    const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'User';
    const tenantSlug = process.env.DEFAULT_TENANT_SLUG?.trim() || 'al-mkki';

    if (!email) {
      throw new Error('ADMIN_EMAIL is required');
    }

    if (!password) {
      throw new Error('ADMIN_PASSWORD is required');
    }

    console.log(`\nUsing tenant: ${tenantSlug}`);

    // 1. Find Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error(`Error: Tenant '${tenantSlug}' not found.`);
      process.exit(1);
    }

    // 2. Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.role === UserRole.ADMIN) {
        console.log(`Admin user ${email} already exists.`);
        return;
      }

      console.warn(`User ${email} already exists with role ${existingUser.role}.`);

      if (isNonInteractive) {
        console.error(
          'Cannot promote user in non-interactive mode. Please set ADMIN_EMAIL to a new user or match an existing ADMIN.',
        );
        process.exit(1);
      }

      const confirm = await ask('Promote this user to ADMIN? (y/n): ');
      if (confirm.toLowerCase() === 'y') {
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.ADMIN,
            emailVerified: true,
          },
        });
        console.log(`User ${updated.email} successfully promoted to ADMIN.`);
        return;
      } else {
        console.log('Operation cancelled.');
        process.exit(0);
      }
    }

    // 3. Create new admin user
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: { en: firstName },
        lastName: { en: lastName },
        role: UserRole.ADMIN,
        tenantId: tenant.id,
        emailVerified: true,
        phone: '+0000000000',
      },
    });

    console.log(`\n✅ SUCCESS! Created verified Admin user:`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Tenant: ${tenant.slug}`);
    console.log(`Role: ${newUser.role}`);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  } finally {
    if (rl) {
      rl.close();
    }
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

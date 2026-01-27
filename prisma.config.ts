import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx ts-node src/scripts/seed-tenant.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});

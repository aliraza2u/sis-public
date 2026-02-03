import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? process.env.APP_PORT ?? '3000', 10),
  prefix: process.env.APP_PREFIX || 'api',
  name: process.env.APP_NAME || 'Student Information System',
  defaultTenantSlug: process.env.DEFAULT_TENANT_SLUG,
}));

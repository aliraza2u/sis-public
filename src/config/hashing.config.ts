import { registerAs } from '@nestjs/config';

export default registerAs('hashing', () => ({
  saltRounds: process.env.APP_SALT_ROUNDS ? parseInt(process.env.APP_SALT_ROUNDS, 10) : 12,
}));

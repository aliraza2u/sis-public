import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  emailVerificationExpiry: process.env.AUTH_EMAIL_VERIFICATION_EXPIRY
    ? parseInt(process.env.AUTH_EMAIL_VERIFICATION_EXPIRY, 10)
    : 24,
  passwordResetExpiry: process.env.AUTH_PASSWORD_RESET_EXPIRY
    ? parseInt(process.env.AUTH_PASSWORD_RESET_EXPIRY, 10)
    : 1,
  refreshTokenExpiryDays: process.env.AUTH_REFRESH_TOKEN_EXPIRY_DAYS
    ? parseInt(process.env.AUTH_REFRESH_TOKEN_EXPIRY_DAYS, 10)
    : 7,
}));

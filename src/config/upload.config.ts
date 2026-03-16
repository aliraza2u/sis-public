import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  uploadDir: process.env.UPLOAD_DIR || './uploads',
}));

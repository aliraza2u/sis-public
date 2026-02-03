import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmailService } from '../modules/email/email.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TestEmailScript');
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const emailService = app.get(EmailService);

    const testEmail = 'raza8r@gmail.com';
    logger.log(`Attempting to send test email to ${testEmail}...`);

    // Using sendVerificationEmail as a test case since it's a public method
    // We pass a dummy token "TEST-TOKEN-123"
    await emailService.sendVerificationEmail(testEmail, 'TEST-TOKEN-123');

    logger.log('Email sent successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to send email', error);
    process.exit(1);
  }
}

bootstrap();

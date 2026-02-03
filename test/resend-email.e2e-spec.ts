import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { EmailService } from './../src/modules/email/email.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Resend Verification (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let emailService: EmailService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
      })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    emailService = app.get<EmailService>(EmailService);

    // Clean up
    await prismaService.user.deleteMany({
      where: { email: { contains: 'resend-test-' } },
    });
    // Ensure default languages/tenant exist (reusing from previous tests approach effectively)
    // Assuming seeds run or existing data from other tests persists if same DB
    // Ideally we run seeds here if independent.
    await prismaService.supportedLanguage.createMany({
      data: [
        { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
        { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
      ],
      skipDuplicates: true,
    });

    const existingTenant = await prismaService.tenant.findFirst();
    if (!existingTenant) {
      await prismaService.tenant.create({
        data: {
          name: { en: 'Al Mkki E2E' },
          slug: 'al-mkki-e2e',
          contactEmail: 'e2e-admin@almkki.edu',
          contactPhone: '+1234567890',
          defaultLanguageCode: 'en',
        },
      });
    }
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({
      where: { email: { contains: 'resend-test-' } },
    });
    await app.close();
  });

  const uniqueId = Date.now();
  const testUser = {
    email: `resend-test-${uniqueId}@example.com`,
    password: 'Password123!',
    firstName: 'Resend',
    lastName: 'Test',
    phone: '+1234567890',
  };

  it('1. Seed Unverified User', async () => {
    const tenant = await prismaService.tenant.findFirst();
    const hashedPassword = await import('bcrypt').then((m) => m.hash(testUser.password, 10));

    await prismaService.user.create({
      data: {
        email: testUser.email,
        passwordHash: hashedPassword,
        firstName: { en: testUser.firstName },
        lastName: { en: testUser.lastName },
        phone: testUser.phone,
        tenantId: tenant!.id,
        role: 'applicant',
        emailVerified: false,
      },
    });
  });

  it('2. Resend verification email (Success)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: testUser.email })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.message).toEqual('Verification email sent');
      });

    // Verify email service was called twice (once for register, once for resend)
    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('3. Resend for non-existent user (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: 'non-existent@example.com' })
      .expect(401);
  });

  it('4. Verify user', async () => {
    // Manually verify
    const user = await prismaService.user.findFirst({ where: { email: testUser.email } });
    if (!user) throw new Error('User not found for manual verification');
    await prismaService.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  });

  it('5. Resend verification for verified user (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: testUser.email })
      .expect(400)
      .expect((res) => {
        // Errors are not wrapped by TransformInterceptor by default
        expect(res.body.message).toEqual('Email is already verified');
      });
  });
});

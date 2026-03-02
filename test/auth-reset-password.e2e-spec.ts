import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { EmailService } from '../src/modules/email/email.service';

describe('Auth Controller - Password Reset & Me (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    email: `e2e-reset-${Date.now()}@example.com`,
    password: 'Password123!',
    firstName: 'E2E',
    lastName: 'Reset',
    phone: '+1234567890',
  };

  let accessToken: string;
  let resetToken: string;

  it('1. Seed User', async () => {
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
        roles: ['student'],
        emailVerified: true,
        isPasswordCreated: true,
      },
    });
  });

  it('/auth/login (POST) - Login to get token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = response.body.data.access_token;
  });

  it('/users/me (GET) - Get Profile', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.email).toBe(testUser.email);
  });

  it('/auth/forgot-password (POST) - Request Reset', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(200);

    // Fetch the token from DB manually for testing
    const user = await prismaService.user.findFirst({ where: { email: testUser.email } });
    expect(user?.passwordResetToken).toBeDefined();
    resetToken = user?.passwordResetToken as string;
  });

  it('/auth/reset-password (POST) - Reset Password', async () => {
    const newPassword = 'NewPassword456!';
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword })
      .expect(200);

    // Verify login with OLD password fails
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(401);

    // Verify login with NEW password succeeds
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: newPassword })
      .expect(200);

    // Update accessToken for subsequent tests if needed
    accessToken = response.body.data.access_token;
  });
});

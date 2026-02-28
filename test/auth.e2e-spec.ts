import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { EmailService } from './../src/modules/email/email.service';

describe('AuthController (e2e)', () => {
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

    // Clean up database before tests
    await prismaService.refreshToken.deleteMany();
    await prismaService.user.deleteMany({
      where: { email: { contains: 'e2e-' } },
    });
    await prismaService.tenant.deleteMany({
      where: { contactEmail: { contains: 'e2e-' } },
    });

    // Seed languages
    await prismaService.supportedLanguage.createMany({
      data: [
        { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
        { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
      ],
      skipDuplicates: true,
    });

    // Seed a default tenant for tests if not exists
    let tenant = await prismaService.tenant.findFirst();
    if (!tenant) {
      tenant = await prismaService.tenant.create({
        data: {
          name: { en: 'Al Mkki E2E' },
          slug: 'al-mkki-e2e',
          contactEmail: 'e2e-admin@almkki.edu',
          contactPhone: '+1234567890',
          defaultLanguageCode: 'en',
        },
      });
    }

    // Seed a Test User
    const hashedPassword = await import('bcrypt').then((m) => m.hash(testUser.password, 10));
    await prismaService.user.create({
      data: {
        email: testUser.email,
        passwordHash: hashedPassword,
        firstName: { en: testUser.firstName },
        lastName: { en: testUser.lastName },
        phone: testUser.phone,
        tenantId: tenant.id,
        roles: ['student'],
        emailVerified: true, // Auto-verify for login tests
        isPasswordCreated: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: { email: { contains: 'e2e-test' } },
    });
    await prismaService.tenant.deleteMany({
      where: { contactEmail: { contains: 'e2e-test' } },
    });
    await app.close();
  });

  const uniqueId = Date.now();
  const testUser = {
    email: `e2e-verify-test-${uniqueId}@example.com`,
    password: 'Password123!',
    firstName: 'E2E',
    lastName: 'Test User',
    phone: '+1234567890',
  };

  let params: { access_token?: string; refresh_token?: string } = {};

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.data.access_token).toBeDefined();
    expect(response.body.data.refresh_token).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(testUser.email);

    params.access_token = response.body.data.access_token;
    params.refresh_token = response.body.data.refresh_token;
  });

  it('/auth/refresh (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refresh_token: params.refresh_token })
      .expect(200);

    expect(response.body.data.access_token).toBeDefined();
    expect(response.body.data.refresh_token).toBeDefined();

    // Update tokens
    params.access_token = response.body.data.access_token;
    params.refresh_token = response.body.data.refresh_token;
  });

  it('/auth/logout (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${params.access_token}`)
      .expect(200);

    // Verify refresh token is revoked (by trying to use it)
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refresh_token: params.refresh_token })
      .expect(401);
  });

  it('/auth/login (POST) - Invalid Password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!',
      })
      .expect(401); // Unauthorized
  });
});

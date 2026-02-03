import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { EmailService } from './../src/modules/email/email.service';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); // No versioning in test setup
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up database
    await prismaService.refreshToken.deleteMany();
    await prismaService.user.deleteMany({
      where: { email: { contains: 'rbac-test-' } },
    });

    // Seed languages
    await prismaService.supportedLanguage.createMany({
      data: [
        { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
        { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
      ],
      skipDuplicates: true,
    });

    // Seed default tenant
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
      where: { email: { contains: 'rbac-test-' } },
    });
    await prismaService.$disconnect();
    await app.close();
  });

  const uniqueId = Date.now();
  const testUser = {
    email: `rbac-test-${uniqueId}@example.com`,
    password: 'Password123!',
    firstName: 'RBAC',
    lastName: 'Test',
    phone: '+1234567890',
  };

  let accessToken: string;
  let userId: string;

  it('1. Seed user (default role: applicant)', async () => {
    const tenant = await prismaService.tenant.findFirst();
    const hashedPassword = await import('bcrypt').then((m) => m.hash(testUser.password, 10));

    const user = await prismaService.user.create({
      data: {
        email: testUser.email,
        passwordHash: hashedPassword,
        firstName: { en: testUser.firstName },
        lastName: { en: testUser.lastName },
        phone: testUser.phone,
        tenantId: tenant!.id,
        role: 'applicant',
        emailVerified: true,
      },
    });

    userId = user.id;
  });

  it('2. Login to get token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = response.body.data.access_token;
  });

  it('3. Access admin-only endpoint as applicant -> 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('4. Promote user to admin', async () => {
    await prismaService.user.update({
      where: { id: userId },
      data: { role: 'admin' },
    });
  });

  it('5. Login again to refresh claims', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = response.body.data.access_token;
  });

  it('6. Access admin-only endpoint as admin -> 200 OK', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.message).toEqual('Hello Admin');
  });
});

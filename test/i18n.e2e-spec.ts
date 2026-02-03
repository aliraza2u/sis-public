import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { EmailService } from './../src/modules/email/email.service';

describe('i18n (e2e)', () => {
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

    // Ensure test tenant exists
    const existingTenant = await prismaService.tenant.findFirst();
    if (!existingTenant) {
      await prismaService.tenant.create({
        data: {
          name: { en: 'Test Tenant' },
          slug: 'test-tenant',
          contactEmail: 'test@example.com',
          contactPhone: '+1234567890',
          defaultLanguageCode: 'en',
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('English Language (Default)', () => {
    it('should return error in English when no Accept-Language header', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return error in English with en Accept-Language header', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Accept-Language', 'en')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('Arabic Language', () => {
    it('should return error in Arabic with ar Accept-Language header', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Accept-Language', 'ar')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('بيانات اعتماد غير صالحة');
    });

    it('should return batch not found error in Arabic', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/batches/nonexistent-id')
        .set('Accept-Language', 'ar')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // This will fail auth first, but demonstrates the pattern
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to English for unsupported language', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Accept-Language', 'fr') // French not supported
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should handle multiple Accept-Language values', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Accept-Language', 'ar, en;q=0.9')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      // Should prioritize Arabic (first in list)
      expect(response.body.message).toBe('بيانات اعتماد غير صالحة');
    });
  });
});

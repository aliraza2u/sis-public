import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { EmailService } from './../src/modules/email/email.service';

describe('CourseController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let accessToken: string;
  let tenantId: string;
  let userId: string;

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
    app.setGlobalPrefix('api');
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up
    await prismaService.course.deleteMany();
    await prismaService.user.deleteMany({ where: { email: { contains: 'e2e-course' } } });
    await prismaService.tenant.deleteMany({ where: { contactEmail: { contains: 'e2e-course' } } });

    // Seed Languages
    await prismaService.supportedLanguage.createMany({
      data: [
        { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
        { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
      ],
      skipDuplicates: true,
    });

    // Create Tenant
    const tenant = await prismaService.tenant.create({
      data: {
        name: { en: 'Course Test Tenant' },
        slug: 'course-test-tenant-' + Date.now(),
        contactEmail: 'e2e-course@example.com',
        defaultLanguageCode: 'en',
      },
    });
    tenantId = tenant.id;

    // Create User & Login to get Token
    const uniqueId = Date.now();
    const testUser = {
      email: `e2e-course-${uniqueId}@example.com`,
      password: 'Password123!',
      firstName: 'Course',
      lastName: 'Tester',
      phone: '+1234567890',
    };

    // Seed User
    const hashedPassword = await import('bcrypt').then((m) => m.hash(testUser.password, 10));
    const user = await prismaService.user.create({
      data: {
        email: testUser.email,
        passwordHash: hashedPassword,
        firstName: { en: testUser.firstName },
        lastName: { en: testUser.lastName },
        phone: testUser.phone,
        tenantId: tenant.id,
        role: 'admin',
        emailVerified: true,
        isPasswordCreated: true,
      },
    });
    userId = user.id;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    await prismaService.course.deleteMany();
    await prismaService.user.deleteMany({ where: { email: { contains: 'e2e-course' } } });
    await prismaService.tenant.deleteMany({ where: { contactEmail: { contains: 'e2e-course' } } });
    await app.close();
  });

  let courseId: string;

  it('/courses (POST) - Create Course', async () => {
    const createDto = {
      title: { en: 'E2E Test Course' },
      code: 'E2E',
      description: { en: 'Description' },
      level: 'beginner',
      durationWeeks: 4,
    };

    const response = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.title.en).toBe(createDto.title.en);
    courseId = response.body.data.id;

    // Verify Audit
    const dbCourse = await prismaService.course.findUnique({ where: { id: courseId } });
    if (!dbCourse) throw new Error('Course not found in DB');
    expect(dbCourse.createdBy).toBe(userId);
  });

  it('/courses (GET) - List Courses', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    const found = response.body.data.find((c: any) => c.id === courseId);
    expect(found).toBeDefined();
  });

  it('/courses/:id (GET) - Get Course', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.id).toBe(courseId);
  });

  it('/courses/:id (PATCH) - Update Course', async () => {
    const updateDto = {
      level: 'intermediate',
    };

    const response = await request(app.getHttpServer())
      .patch(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateDto)
      .expect(200);

    expect(response.body.data.level).toBe('intermediate');

    // Verify Audit
    const dbCourse = await prismaService.course.findUnique({ where: { id: courseId } });
    expect(dbCourse?.updatedBy).toBe(userId);
  });

  it('/courses/:id (DELETE) - Soft Delete Course', async () => {
    await request(app.getHttpServer())
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Verify via Get -> Should be 404
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    // Verify via DB (Soft Deleted)
    // We need to query raw or disable middleware?
    // PrismaService has the extensions enabled.
    // findUnique adds deletedAt: null.
    // So findUnique should return null.

    const notFound = await prismaService.course.findUnique({ where: { id: courseId } });
    expect(notFound).toBeNull();

    // Check raw to confirm it exists but is deleted
    const raw: any[] = await prismaService.$queryRaw`SELECT * FROM courses WHERE id = ${courseId}`;
    expect(raw.length).toBe(1);
    expect(raw[0].deleted_at).not.toBeNull();
    expect(raw[0].is_active).toBe(false);
    expect(raw[0].deleted_by).toBe(userId);
  });
});

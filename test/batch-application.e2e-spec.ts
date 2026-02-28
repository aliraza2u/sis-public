import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { EmailService } from './../src/modules/email/email.service';
import { randomUUID } from 'crypto';

describe('Batch & Application Flow (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminToken: string;
  let applicantToken: string;
  let tenantId: string;
  let adminId: string;
  let applicantId: string;
  let adminEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendApplicationApprovalEmail: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up
    await prismaService.application.deleteMany();
    await prismaService.batch.deleteMany();
    await prismaService.course.deleteMany();
    await prismaService.user.deleteMany({ where: { email: { contains: 'batch' } } });
    await prismaService.user.deleteMany({ where: { email: { contains: 'batch' } } });
    await prismaService.tenant.deleteMany({ where: { contactEmail: { contains: 'batch' } } });
    await prismaService.studentIdCounter.deleteMany();

    // Seed Languages (if not exists)
    await prismaService.supportedLanguage.createMany({
      data: [
        { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
        { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
      ],
      skipDuplicates: true,
    });

    // 1. Create Tenant (Mocking manual creation to ensure Alias)
    const tenant = await prismaService.tenant.create({
      data: {
        name: { en: 'Batch Test Tenant' },
        slug: 'batch-test-tenant-' + Date.now(),
        alias: 'BT', // IMPORTANT
        contactEmail: 'e2e-batch@example.com',
        defaultLanguageCode: 'en',
      },
    });
    tenantId = tenant.id;

    // 2. Create Admin User via Seed
    adminEmail = `admin-batch-${randomUUID()}@example.com`;
    const hashedPassword = await import('bcrypt').then((m) => m.hash('Password123!', 10));

    const dbAdmin = await prismaService.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: { en: 'Admin' },
        lastName: { en: 'User' },
        phone: '+1111111111',
        roles: ['admin'],
        emailVerified: true,
        tenantId: tenant.id,
        isPasswordCreated: true,
      },
    });
    adminId = dbAdmin.id;

    const adminLogin = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    adminToken = adminLogin.body.data.access_token;

    // Decode Token
    const payload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
    console.log('SETUP - Admin Token Payload TenantID:', payload.tenantId);

    if (payload.tenantId !== tenantId) {
      console.error('MISMATCH DETECTED: Token has different TenantID than DB User!');
    }

    // 3. Create Applicant User via Seed
    const applicantEmail = `applicant-batch-${randomUUID()}@example.com`;
    const dbApplicant = await prismaService.user.create({
      data: {
        email: applicantEmail,
        passwordHash: hashedPassword, // Reuse hash
        firstName: { en: 'Student' },
        lastName: { en: 'User' },
        phone: '+2222222222',
        roles: ['student'],
        emailVerified: true,
        tenantId: tenant.id,
        isPasswordCreated: true,
      },
    });
    applicantId = dbApplicant.id;

    const applicantLogin = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: applicantEmail,
      password: 'Password123!',
    });
    applicantToken = applicantLogin.body.data.access_token;
  });

  afterAll(async () => {
    // Cleanup
    await prismaService.application.deleteMany();
    await prismaService.batch.deleteMany();
    await prismaService.course.deleteMany();
    await prismaService.user.deleteMany({ where: { email: { contains: 'batch' } } });
    await prismaService.tenant.deleteMany({ where: { contactEmail: { contains: 'batch' } } });
    await app.close();
  });

  let courseId: string;
  let batchId: string;
  let applicationId: string;

  it('1. Create Course (Admin)', async () => {
    const createDto = {
      title: { en: 'Full Stack Development' },
      code: 'FSD', // Code for ID generation
      description: { en: 'Learn everything' },
    };

    const res = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createDto)
      .expect(201);

    courseId = res.body.data.id;
    expect(res.body.data.code).toBe('FSD');
  });

  it('2. Create Batch (Admin)', async () => {
    const createDto = {
      name: { en: 'Fall 2025' },
      batchNumber: '01',
      enrollmentStartDate: new Date().toISOString(), // Open now
      enrollmentEndDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      startDate: new Date(Date.now() + 172800000).toISOString(),
      maxStudents: 50,
    };

    const res = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/batches`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createDto)
      .expect(201);

    console.log('TEST - Batch TenantID:', res.body.data.tenantId);

    batchId = res.body.data.id;
    expect(res.body.data.batchNumber).toBe('01');
    expect(res.body.data.courseId).toBe(courseId);
    expect(res.body.data.tenantId).toBe(tenantId);
  });

  it('3. Submit Application (Applicant)', async () => {
    const createDto = {
      personalInfo: { dob: '2000-01-01', gender: 'male' },
      educationInfo: { degree: 'BS CS' },
    };

    const res = await request(app.getHttpServer())
      .post(`/api/batches/${batchId}/apply`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send(createDto)
      .expect(201);

    applicationId = res.body.data.id;
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.applicationNumber).toBeDefined();
    expect(res.body.data.rollNumber).toBeNull(); // No roll no yet
  });

  it('4. List Applications (Admin) - Verify Visibility', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/applications?batchId=${batchId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // List endpoint returns array directly in data: []
    expect(Array.isArray(res.body.data)).toBe(true);
    const foundApp = res.body.data.find((a: any) => a.id === applicationId);
    expect(foundApp).toBeDefined();
  });

  it('5. Approve Application (Admin) & Check Roll Number', async () => {
    const updateDto = {
      status: 'approved',
      reviewNotes: 'Looks good',
    };

    const res = await request(app.getHttpServer())
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateDto)
      .expect(200);

    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.rollNumber).toBeDefined();

    // Verify Format: STU-{TenantAlias}-{CourseCode}-{BatchNumber}-{Sequence}
    const expectedPrefix = 'STU-BT-FSD-01-';
    expect(res.body.data.rollNumber).toContain(expectedPrefix);
    expect(res.body.data.rollNumber.split('-').pop()).toBe('001');
  });

  it('6. Approve Second Application (Verify Sequence)', async () => {
    // Create another applicant
    const unique = randomUUID();
    const email = `app2-${unique}@example.com`;
    const hashedPassword = await import('bcrypt').then((m) => m.hash('Password123!', 10));

    await prismaService.user.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        firstName: { en: 'Student2' },
        lastName: { en: 'User' },
        roles: ['student'],
        emailVerified: true,
        tenantId: tenantId,
        isPasswordCreated: true,
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: email, password: 'Password123!' });
    const token2 = login.body.data.access_token;

    // Apply
    const applyRes = await request(app.getHttpServer())
      .post(`/api/batches/${batchId}/apply`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ personalInfo: {} })
      .expect(201);
    const appId2 = applyRes.body.data.id;

    // Approve
    const approveRes = await request(app.getHttpServer())
      .patch(`/api/applications/${appId2}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(200);

    const rollNumber = approveRes.body.data.rollNumber;
    expect(rollNumber).toContain('STU-BT-FSD-01-');
    expect(rollNumber.endsWith('002')).toBe(true);
  });
});

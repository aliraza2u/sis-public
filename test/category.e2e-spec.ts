import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { EmailService } from './../src/modules/email/email.service';

describe('CategoryController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminToken: string;
  let tenantId: string;

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

    // Clean up test categories
    await prismaService.category.deleteMany({
      where: { slug: { contains: 'e2e-category' } },
    });

    // Seed languages
    await prismaService.supportedLanguage.createMany({
      data: [
        { code: 'en', nameEnglish: 'English', nameNative: 'English', isRtl: false },
        { code: 'ar', nameEnglish: 'Arabic', nameNative: 'العربية', isRtl: true },
      ],
      skipDuplicates: true,
    });

    // Get or Create tenant for tests
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
    tenantId = tenant.id;

    // Create and login admin user
    const uniqueId = Date.now();
    const adminUser = {
      email: `e2e-admin-${uniqueId}@example.com`,
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
    };

    // Create admin user directly
    const hashedPassword = await import('bcrypt').then((m) => m.hash(adminUser.password, 10));
    const user = await prismaService.user.create({
      data: {
        email: adminUser.email,
        passwordHash: hashedPassword,
        firstName: { en: adminUser.firstName },
        lastName: { en: adminUser.lastName },
        phone: adminUser.phone,
        tenantId: tenant.id,
        role: 'admin',
        emailVerified: true,
        isPasswordCreated: true,
      },
    });

    // Login as admin
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      })
      .expect(200);

    adminToken = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    // Clean up test categories
    await prismaService.category.deleteMany({
      where: { slug: { contains: 'e2e-category' } },
    });

    // Clean up test users
    await prismaService.user.deleteMany({
      where: { email: { contains: 'e2e-admin' } },
    });

    await app.close();
  });

  let createdCategoryId: string;

  describe('Category CRUD Operations', () => {
    it('/categories (POST) - Create category as admin', async () => {
      const categoryData = {
        name: { en: 'Islamic Studies', ar: 'الدراسات الإسلامية' },
        slug: 'e2e-category-islamic-studies',
        sortOrder: 1,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toEqual(categoryData.name);
      expect(response.body.data.slug).toBe(categoryData.slug);
      expect(response.body.data.sortOrder).toBe(categoryData.sortOrder);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.tenantId).toBe(tenantId);

      createdCategoryId = response.body.data.id;
    });

    it('/categories (POST) - Duplicate slug should fail', async () => {
      const categoryData = {
        name: { en: 'Duplicate Category', ar: 'فئة مكررة' },
        slug: 'e2e-category-islamic-studies', // Same slug as above
        sortOrder: 2,
      };

      await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(409); // Conflict
    });

    it('/categories (POST) - Unauthorized without token', async () => {
      const categoryData = {
        name: { en: 'Test Category', ar: 'فئة الاختبار' },
        slug: 'e2e-category-test',
      };

      await request(app.getHttpServer()).post('/api/categories').send(categoryData).expect(401);
    });

    it('/categories (GET) - List all categories (public)', async () => {
      const response = await request(app.getHttpServer()).get('/api/categories').expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const category = response.body.data.find((c: any) => c.id === createdCategoryId);
      expect(category).toBeDefined();
      expect(category.name.en).toBe('Islamic Studies');
    });

    it('/categories/:id (GET) - Get category by ID (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${createdCategoryId}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(createdCategoryId);
      expect(response.body.data.name.en).toBe('Islamic Studies');
      expect(response.body.data.name.ar).toBe('الدراسات الإسلامية');
    });

    it('/categories/:id (GET) - Not found for invalid ID', async () => {
      await request(app.getHttpServer()).get('/api/categories/invalid-id').expect(404);
    });

    it('/categories/:id (PATCH) - Update category as admin', async () => {
      const updateData = {
        name: { en: 'Islamic Studies Updated', ar: 'الدراسات الإسلامية المحدثة' },
        sortOrder: 5,
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name.en).toBe('Islamic Studies Updated');
      expect(response.body.data.name.ar).toBe('الدراسات الإسلامية المحدثة');
      expect(response.body.data.sortOrder).toBe(5);
      expect(response.body.data.isActive).toBe(false);
    });

    it('/categories/:id (PATCH) - Update with duplicate slug should fail', async () => {
      // Create another category
      const anotherCategory = {
        name: { en: 'Another Category', ar: 'فئة أخرى' },
        slug: 'e2e-category-another',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(anotherCategory)
        .expect(201);

      // Try to update with existing slug
      await request(app.getHttpServer())
        .patch(`/api/categories/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'e2e-category-islamic-studies' })
        .expect(409);

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/categories/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('/categories/:id (DELETE) - Soft delete category as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/api/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's soft deleted (shouldn't appear in list)
      const listResponse = await request(app.getHttpServer()).get('/api/categories').expect(200);

      const deletedCategory = listResponse.body.data.find((c: any) => c.id === createdCategoryId);
      expect(deletedCategory).toBeUndefined();
    });

    it('/categories/:id (DELETE) - Unauthorized without token', async () => {
      await request(app.getHttpServer()).delete(`/api/categories/${createdCategoryId}`).expect(401);
    });
  });

  describe('Category-Course Integration', () => {
    let categoryId: string;
    let courseId: string;

    it('Should create category and course with category reference', async () => {
      // Create category
      const categoryResponse = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'Quran Studies', ar: 'دراسات القرآن' },
          slug: 'e2e-category-quran-studies',
        })
        .expect(201);

      categoryId = categoryResponse.body.data.id;

      // Create course with category
      const courseResponse = await request(app.getHttpServer())
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: { en: 'Introduction to Quran', ar: 'مقدمة في القرآن' },
          categoryId: categoryId,
          code: 'QRN101',
        })
        .expect(201);

      courseId = courseResponse.body.data.id;
      expect(courseResponse.body.data.categoryId).toBe(categoryId);
    });

    it('Should retrieve course with category details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.category.id).toBe(categoryId);
      expect(response.body.data.category.name.en).toBe('Quran Studies');
    });

    it('Should list all courses with category data', async () => {
      const response = await request(app.getHttpServer()).get('/api/courses').expect(200);

      const course = response.body.data.find((c: any) => c.id === courseId);
      expect(course).toBeDefined();
      expect(course.category).toBeDefined();
      expect(course.category.name.en).toBe('Quran Studies');
    });

    // Clean up
    afterAll(async () => {
      if (courseId) {
        await request(app.getHttpServer())
          .delete(`/api/courses/${courseId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
      if (categoryId) {
        await request(app.getHttpServer())
          .delete(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });
  });
});

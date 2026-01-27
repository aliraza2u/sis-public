import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
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
    email: `e2e-test-${uniqueId}@example.com`,
    password: 'Password123!',
    name: 'E2E Test User',
  };

  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.email).toBe(testUser.email);
    expect(response.body.data.tenant).toBeDefined();
    // Expecting to join the default tenant (Al-Mkki from seed)
    // expect(response.body.data.tenant.slug).toBe('al-mkki');
  });

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
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(testUser.email);
  });

  it('/auth/register (POST) - Duplicate Email', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(409); // Conflict
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

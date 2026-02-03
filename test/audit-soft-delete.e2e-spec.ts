import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

describe('Audit & Soft Delete (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const mockUserId = 'mock-user-uuid-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ClsService)
      .useValue({
        get: (key: string) => {
          if (key === 'userId') return mockUserId;
          return null;
        },
        isActive: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up
    await prismaService.tenant.deleteMany({
      where: { slug: { contains: 'audit-test' } },
    });
  });

  afterAll(async () => {
    await prismaService.tenant.deleteMany({
      where: { slug: { contains: 'audit-test' } },
    });
    await app.close();
  });

  let tenantId: string;

  it('1. Create Tenant -> Should have createdBy and updatedBy set', async () => {
    const tenant = await prismaService.tenant.create({
      data: {
        name: { en: 'Audit Test' },
        slug: `audit-test-tenant-${Date.now()}`,
        contactEmail: 'audit@test.com',
      },
    });
    tenantId = tenant.id;

    expect(tenant.createdBy).toBe(mockUserId);
    expect(tenant.updatedBy).toBe(mockUserId);
    expect(tenant.deletedAt).toBeNull();
  });

  it('2. Update Tenant -> Should update updatedBy', async () => {
    // wait a bit to ensure updatedAt changes if we were checking time, but checking userId is enough
    const updated = await prismaService.tenant.update({
      where: { id: tenantId },
      data: {
        contactPhone: '123456',
      },
    });

    expect(updated.updatedBy).toBe(mockUserId);
    expect(updated.createdBy).toBe(mockUserId); // Should verify it didn't verify change createdBy
  });

  it('3. Soft Delete Tenant -> Should set deletedAt and existing record should be hidden', async () => {
    const deleted = await prismaService.tenant.delete({
      where: { id: tenantId },
    });

    // The delete operation returns the record being "deleted" (updated in reality)
    expect(deleted.deletedAt).toBeInstanceOf(Date);
    expect(deleted.deletedBy).toBe(mockUserId);

    // Verify it is hidden from standard queries
    const found = await prismaService.tenant.findUnique({
      where: { id: tenantId },
    });
    expect(found).toBeNull();
  });

  it('4. Verify record still exists in DB (Raw Query)', async () => {
    // We need to bypass the extension to verify it exists
    // Since PrismaService is extended, we can use $queryRaw to check raw DB
    const raw: any[] = await prismaService.$queryRaw`SELECT * FROM tenants WHERE id = ${tenantId}`;
    expect(raw.length).toBe(1);
    expect(raw[0].deleted_at).not.toBeNull();
    expect(raw[0].deleted_by).toBe(mockUserId);
  });
});

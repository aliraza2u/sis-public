import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

describe('Soft Delete Scope Verification (e2e)', () => {
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
    await prismaService.supportedLanguage.deleteMany({
      where: { code: 'xy' },
    });
  });

  afterAll(async () => {
    await prismaService.supportedLanguage.deleteMany({
      where: { code: 'xy' },
    });
    await app.close();
  });

  it('1. Create and Hard Delete SupportedLanguage -> Should actually delete record', async () => {
    // Create a regular record that should NOT be soft deleted
    await prismaService.supportedLanguage.create({
      data: {
        code: 'xy',
        nameEnglish: 'TestLang',
        nameNative: 'TestLangNative',
        isRtl: false,
      },
    });

    // Delete it
    await prismaService.supportedLanguage.delete({
      where: { code: 'xy' },
    });

    // Verify it is GONE (hard deleted)
    // We use a raw query or findUnique.
    // Since 'supportedLanguage' is NOT in the soft-delete extension list, findUnique shouldn't be filtering deletedAt logic anyway.
    const unique = await prismaService.supportedLanguage.findUnique({
      where: { code: 'xy' },
    });
    expect(unique).toBeNull();

    // Verify raw to be absolutely sure
    const raw: any[] =
      await prismaService.$queryRaw`SELECT * FROM supported_languages WHERE code = 'xy'`;
    expect(raw.length).toBe(0);
  });
});

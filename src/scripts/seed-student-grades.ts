import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { UserRole, GradeSource, GradeResult } from '@/infrastructure/prisma/client/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const logger = console;

  logger.log('--- Starting Student Grades Seeding ---');

  // 1. Get first tenant and its students
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!tenant) {
    logger.error('No tenant found. Run seed:users-tenants first.');
    await app.close();
    process.exit(1);
  }

  const students = await prisma.user.findMany({
    where: { tenantId: tenant.id, roles: { has: UserRole.student }, isActive: true },
    take: 5,
  });
  if (students.length === 0) {
    logger.error('No students found for tenant. Run seed:users-tenants first.');
    await app.close();
    process.exit(1);
  }

  // 2. Get or create courses for this tenant
  let courses = await prisma.course.findMany({
    where: { tenantId: tenant.id },
    take: 3,
  });

  if (courses.length === 0) {
    logger.log('No courses found. Creating minimal courses for grading seed...');
    const admin = await prisma.user.findFirst({
      where: { tenantId: tenant.id, roles: { has: UserRole.admin } },
    });
    const courseData = [
      { title: { en: 'Python Bootcamp', ar: 'معسكر بايثون' }, code: 'PY101' },
      { title: { en: 'Advanced Web Development', ar: 'تطوير الويب المتقدم' }, code: 'WEB201' },
      { title: { en: 'Data Science Fundamentals', ar: 'أساسيات علم البيانات' }, code: 'DS301' },
    ];
    for (const c of courseData) {
      const course = await prisma.course.create({
        data: {
          tenantId: tenant.id,
          title: c.title,
          code: c.code,
          createdBy: admin?.id ?? undefined,
        },
      });
      courses.push(course);
      logger.log(`Created course: ${c.code} (${course.id})`);
    }
  }

  // 3. Seed StudentCourseGrade: mix of manual and import-style (with breakdown)
  const s0 = students[0];
  const s1 = students[1];
  const s2 = students[2];
  const c0 = courses[0];
  const c1 = courses[1];

  const gradeRecords: Array<{
    tenantId: string;
    userId: string;
    courseId: string;
    source: GradeSource;
    finalResult: GradeResult;
    finalGrade?: string;
    finalScore?: number;
    breakdown: object[];
  }> = [];

  if (s0 && c0) {
    gradeRecords.push(
      // First student, first course: import-style WITH breakdown (so transcript has data even with 1 student)
      {
        tenantId: tenant.id,
        userId: s0.id,
        courseId: c0.id,
        source: GradeSource.import,
        finalResult: GradeResult.pass,
        finalGrade: 'A',
        finalScore: 92,
        breakdown: [
          { type: 'quiz', name: 'Quiz 1', score: 9, maxScore: 10 },
          { type: 'quiz', name: 'Quiz 2', score: 8, maxScore: 10 },
          { type: 'assignment', name: 'Assignment 1', score: 18, maxScore: 20 },
          { type: 'assignment', name: 'Final Project', score: 57, maxScore: 60 },
        ],
      },
      ...(c1
        ? [
            {
              tenantId: tenant.id,
              userId: s0.id,
              courseId: c1.id,
              source: GradeSource.manual,
              finalResult: GradeResult.pass,
              finalGrade: 'B+',
              finalScore: 87,
              breakdown: [],
            },
          ]
        : []),
    );
  }
  if (s1 && c0) {
    gradeRecords.push(
      {
        tenantId: tenant.id,
        userId: s1.id,
        courseId: c0.id,
        source: GradeSource.import,
        finalResult: GradeResult.pass,
        finalGrade: 'A-',
        finalScore: 88,
        breakdown: [
          { type: 'quiz', name: 'Quiz 1', score: 8, maxScore: 10 },
          { type: 'quiz', name: 'Quiz 2', score: 9, maxScore: 10 },
          { type: 'assignment', name: 'Assignment 1', score: 18, maxScore: 20 },
          { type: 'assignment', name: 'Final Project', score: 53, maxScore: 60 },
        ],
      },
      ...(c1
        ? [
            {
              tenantId: tenant.id,
              userId: s1.id,
              courseId: c1.id,
              source: GradeSource.import,
              finalResult: GradeResult.pass,
              finalScore: 85,
              breakdown: [
                { type: 'quiz', name: 'Pop Quiz', score: 10, maxScore: 10 },
                { type: 'assignment', name: 'First Assignment', score: 17, maxScore: 20 },
              ],
            },
          ]
        : []),
    );
  }
  if (s2 && c0) {
    gradeRecords.push({
      tenantId: tenant.id,
      userId: s2.id,
      courseId: c0.id,
      source: GradeSource.manual,
      finalResult: GradeResult.fail,
      finalGrade: 'F',
      finalScore: 45,
      breakdown: [],
    });
  }

  for (const g of gradeRecords) {
    const breakdownJson = JSON.parse(JSON.stringify(g.breakdown)) as object[];
    await prisma.studentCourseGrade.upsert({
      where: {
        tenantId_userId_courseId: {
          tenantId: g.tenantId,
          userId: g.userId,
          courseId: g.courseId,
        },
      },
      update: {
        source: g.source,
        finalResult: g.finalResult,
        finalGrade: g.finalGrade ?? null,
        finalScore: g.finalScore ?? null,
        breakdown: breakdownJson,
      },
      create: {
        ...g,
        breakdown: breakdownJson,
      },
    });
    logger.log(
      `Upserted grade: user ${g.userId.slice(0, 12)}... / course ${g.courseId.slice(0, 12)}... (${g.finalResult})`,
    );
  }

  logger.log('\n--- Student Grades Seeding Completed ---');
  logger.log(`Tenant: ${tenant.slug} (${tenant.id})`);
  logger.log(`Students with grades: ${gradeRecords.length} records across ${courses.length} course(s)`);
  logger.log('\nYou can test GET /grades/transcript/:userId for any seeded student ID.');

  await app.close();
}

bootstrap().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

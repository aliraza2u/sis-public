import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import * as crypto from 'crypto';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  GradeSource,
  GradeResult,
  ApplicationStatus,
} from '@/infrastructure/prisma/client/client';
import { I18nNotFoundException } from '@/common/exceptions/i18n.exception';
import type { UpsertManualGradeDto } from './dto';
import type {
  TranscriptCourseDto,
  GenerateTranscriptResponseDto,
  VerifyTranscriptResponseDto,
  StudentOverviewResponseDto,
  StudentOverviewEnrollmentDto,
} from './dto';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Set or update manual grade for an enrollment (application).
   */
  async upsertManualGrade(tenantId: string, dto: UpsertManualGradeDto) {
    const application = await this.prisma.application.findFirst({
      where: { id: dto.applicationId, tenantId },
      select: { applicantId: true, courseId: true },
    });

    if (!application) {
      throw new I18nNotFoundException('messages.application.notFound');
    }

    const finalScore =
      dto.finalScore != null ? dto.finalScore : null;

    const grade = await this.prisma.studentCourseGrade.upsert({
      where: {
        tenantId_userId_courseId: {
          tenantId,
          userId: application.applicantId,
          courseId: application.courseId,
        },
      },
      update: {
        applicationId: dto.applicationId,
        source: GradeSource.manual,
        finalResult: dto.finalResult === 'pass' ? GradeResult.pass : GradeResult.fail,
        finalGrade: dto.finalGrade ?? null,
        finalScore,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        userId: application.applicantId,
        courseId: application.courseId,
        applicationId: dto.applicationId,
        source: GradeSource.manual,
        finalResult: dto.finalResult === 'pass' ? GradeResult.pass : GradeResult.fail,
        finalGrade: dto.finalGrade ?? null,
        finalScore,
        breakdown: [],
      },
    });

    return grade;
  }

  /**
   * Get transcript for a student: list of course grades (breakdown + final per course).
   * When courseId is provided, returns only that course's grade for the user.
   */
  async getTranscript(
    tenantId: string,
    userId: string,
    courseId?: string,
  ): Promise<TranscriptCourseDto[]> {
    const grades = await this.prisma.studentCourseGrade.findMany({
      where: {
        tenantId,
        userId,
        ...(courseId ? { courseId } : {}),
      },
      include: {
        course: { select: { title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return grades.map((g) => this.toTranscriptCourse(g));
  }

  private toTranscriptCourse(g: {
    course: { title: unknown };
    finalResult: GradeResult;
    finalGrade: string | null;
    finalScore: unknown;
    breakdown: unknown;
  }): TranscriptCourseDto {
    const title = g.course?.title as Record<string, string> | null;
    const courseName =
      (title && (typeof title === 'object' && ('en' in title ? title.en : Object.values(title)[0]))) ||
      '';

    const breakdown = (Array.isArray(g.breakdown) ? g.breakdown : []) as {
      type?: string;
      name?: string;
      score?: number;
      maxScore?: number | null;
    }[];

    return {
      course: courseName,
      breakdown: breakdown.map((b) => ({
        type: b.type ?? 'other',
        name: b.name ?? '',
        score: typeof b.score === 'number' ? b.score : 0,
        maxScore: b.maxScore ?? null,
      })),
      final: {
        score: g.finalScore != null ? Number(g.finalScore) : null,
        grade: g.finalGrade ?? null,
        result: g.finalResult as string,
      },
    };
  }

  /**
   * Generate a transcript for a student. If one already exists, return it with the same token.
   * When courseId is provided, the transcript array contains only that course's grade.
   */
  async generateTranscript(
    tenantId: string,
    userId: string,
    courseId?: string,
  ): Promise<GenerateTranscriptResponseDto> {
    const existing = await this.prisma.transcript.findUnique({
      where: {
        tenantId_userId: { tenantId, userId },
      },
    });

    const transcriptData = await this.getTranscript(tenantId, userId, courseId);

    if (existing) {
      if (!existing.isActive || existing.isRevoked) {
        throw new I18nNotFoundException('messages.transcript.notFound');
      }
      const verificationUrl = this.buildVerificationUrl(existing.verificationToken);
      const [studentName, tenantName] = await Promise.all([
        this.getStudentName(userId),
        this.getTenantName(tenantId),
      ]);
      this.logger.log(`Returned existing transcript ${existing.transcriptNumber} for user ${userId}`);
      return {
        transcriptId: existing.id,
        transcriptNumber: existing.transcriptNumber,
        verificationToken: existing.verificationToken,
        verificationUrl,
        issuedAt: existing.issuedAt,
        studentName,
        tenantName,
        transcript: transcriptData,
      };
    }

    const transcriptNumber = await this.generateTranscriptNumber(tenantId);
    const verificationToken = crypto.randomBytes(64).toString('hex');

    const transcript = await this.prisma.transcript.create({
      data: {
        tenantId,
        userId,
        transcriptNumber,
        verificationToken,
      },
    });

    const verificationUrl = this.buildVerificationUrl(verificationToken);
    const [studentName, tenantName] = await Promise.all([
      this.getStudentName(userId),
      this.getTenantName(tenantId),
    ]);

    this.logger.log(`Generated transcript ${transcriptNumber} for user ${userId}`);
    return {
      transcriptId: transcript.id,
      transcriptNumber: transcript.transcriptNumber,
      verificationToken: transcript.verificationToken,
      verificationUrl,
      issuedAt: transcript.issuedAt,
      studentName,
      tenantName,
      transcript: transcriptData,
    };
  }

  /**
   * Verify a transcript by token or transcript ID. Public endpoint.
   */
  async verifyTranscript(
    token?: string,
    transcriptId?: string,
  ): Promise<VerifyTranscriptResponseDto> {
    const emptyResponse: VerifyTranscriptResponseDto = {
      valid: false,
      transcriptId: null,
      transcriptNumber: null,
      studentName: null,
      tenantName: null,
      issuedAt: null,
      transcript: null,
      error: null,
    };

    if (!token && !transcriptId) {
      emptyResponse.error = await this.i18n.translate('messages.transcript.tokenOrIdRequired');
      return emptyResponse;
    }

    try {
      let transcript: {
        id: string;
        transcriptNumber: string;
        tenantId: string;
        userId: string;
        issuedAt: Date;
        isActive: boolean;
        isRevoked: boolean;
      } | null = null;

      if (transcriptId) {
        const t = await this.prisma.transcript.findUnique({
          where: { id: transcriptId },
        });
        if (t) transcript = t;
      } else if (token) {
        if (!this.isValidTokenFormat(token)) {
          emptyResponse.error = await this.i18n.translate('messages.transcript.invalidTokenFormat');
          return emptyResponse;
        }
        const t = await this.prisma.transcript.findUnique({
          where: { verificationToken: token },
        });
        if (t && t.isActive && !t.isRevoked) transcript = t;
      }

      if (!transcript) {
        emptyResponse.error = await this.i18n.translate('messages.transcript.invalidOrExpiredToken');
        return emptyResponse;
      }

      if (!transcript.isActive || transcript.isRevoked) {
        const errorKey = transcript.isRevoked
          ? 'messages.transcript.revoked'
          : 'messages.transcript.inactive';
        emptyResponse.error = await this.i18n.translate(errorKey);
        emptyResponse.transcriptId = transcript.id;
        emptyResponse.transcriptNumber = transcript.transcriptNumber;
        emptyResponse.issuedAt = transcript.issuedAt;
        return emptyResponse;
      }

      const [transcriptData, studentName, tenantName] = await Promise.all([
        this.getTranscript(transcript.tenantId, transcript.userId),
        this.getStudentName(transcript.userId),
        this.getTenantName(transcript.tenantId),
      ]);

      return {
        valid: true,
        transcriptId: transcript.id,
        transcriptNumber: transcript.transcriptNumber,
        studentName,
        tenantName,
        issuedAt: transcript.issuedAt,
        transcript: transcriptData,
        error: null,
      };
    } catch (err) {
      this.logger.error(`Transcript verification failed: ${(err as Error).message}`);
      emptyResponse.error = await this.i18n.translate('messages.transcript.invalidOrExpiredToken');
      return emptyResponse;
    }
  }

  private async getStudentName(userId: string): Promise<{ en: string; ar: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const fn = (user?.firstName as Record<string, string>) ?? {};
    const ln = (user?.lastName as Record<string, string>) ?? {};
    return {
      en: `${fn.en ?? ''} ${ln.en ?? ''}`.trim(),
      ar: `${fn.ar ?? ''} ${ln.ar ?? ''}`.trim(),
    };
  }

  private async getTenantName(tenantId: string): Promise<Record<string, string> | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    return (tenant?.name as Record<string, string>) ?? null;
  }

  private async generateTranscriptNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRN-${year}-`;
    const last = await this.prisma.transcript.findFirst({
      where: { tenantId, transcriptNumber: { startsWith: prefix } },
      orderBy: { transcriptNumber: 'desc' },
    });
    let seq = 1;
    if (last) {
      const n = parseInt(last.transcriptNumber.replace(prefix, ''), 10);
      if (!isNaN(n)) seq = n + 1;
    }
    return `${prefix}${seq.toString().padStart(6, '0')}`;
  }

  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    if (token.length !== 128) return false;
    return /^[0-9a-fA-F]+$/.test(token);
  }

  private buildVerificationUrl(token: string): string {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('app.frontendUrl') ||
      'https://yourapp.com';
    return `${baseUrl}/transcript/verify?token=${token}`;
  }

  /**
   * Student dashboard: enrollments, batches, grades, progress.
   * Same shape for student (self) and admin (any student in tenant).
   */
  async getStudentOverview(tenantId: string, targetUserId: string): Promise<StudentOverviewResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: targetUserId, tenantId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });
    if (!user) {
      throw new I18nNotFoundException('messages.user.userNotFound');
    }

    const applications = await this.prisma.application.findMany({
      where: {
        tenantId,
        applicantId: targetUserId,
        status: ApplicationStatus.approved,
        deletedAt: null,
      },
      include: {
        batch: true,
        course: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const byCourse = new Map<string, (typeof applications)[0]>();
    for (const app of applications) {
      if (!byCourse.has(app.courseId)) byCourse.set(app.courseId, app);
    }
    const uniqueEnrollments = Array.from(byCourse.values());

    const grades = await this.prisma.studentCourseGrade.findMany({
      where: { tenantId, userId: targetUserId },
    });
    const gradeByCourse = new Map(grades.map((g) => [g.courseId, g]));

    const buildEnrollmentRow = (
      app: (typeof applications)[0] | null,
      courseId: string,
      courseRow: { code: string; title: unknown },
    ): StudentOverviewEnrollmentDto => {
      const g = gradeByCourse.get(courseId);
      const courseProgressStatus = g
        ? (g.courseProgressStatus as 'not_started' | 'in_progress' | 'completed')
        : 'not_started';

      const batch = app?.batch;
      return {
        applicationId: app?.id ?? null,
        courseId,
        courseCode: courseRow.code,
        courseTitle: (courseRow.title as Record<string, string>) ?? {},
        batchId: app?.batchId ?? null,
        batchCode: batch?.code ?? null,
        batchName: (batch?.name as Record<string, string>) ?? {},
        batchStartDate: batch?.startDate ?? null,
        batchEndDate: batch?.endDate ?? null,
        rollNumber: app?.rollNumber ?? null,
        gradeSource: g ? (g.source === GradeSource.manual ? 'manual' : 'import') : null,
        finalResult: g ? (g.finalResult === GradeResult.pass ? 'pass' : 'fail') : null,
        finalGrade: g?.finalGrade ?? null,
        finalScore: g?.finalScore != null ? Number(g.finalScore) : null,
        courseProgressStatus,
        overallProgressPercent: g?.overallProgressPercent ?? null,
      };
    };

    const enrollments: StudentOverviewEnrollmentDto[] = [];

    for (const app of uniqueEnrollments) {
      enrollments.push(
        buildEnrollmentRow(app, app.courseId, {
          code: app.course.code,
          title: app.course.title,
        }),
      );
    }

    const enrolledCourseIds = new Set(uniqueEnrollments.map((e) => e.courseId));
    const gradeOnlyCourseIds = [...new Set(grades.map((g) => g.courseId).filter((id) => !enrolledCourseIds.has(id)))];
    const extraCourses =
      gradeOnlyCourseIds.length > 0
        ? await this.prisma.course.findMany({
            where: { id: { in: gradeOnlyCourseIds }, tenantId, deletedAt: null },
            select: { id: true, code: true, title: true },
          })
        : [];
    const extraCourseById = new Map(extraCourses.map((c) => [c.id, c]));
    for (const cid of gradeOnlyCourseIds) {
      const course = extraCourseById.get(cid);
      if (!course) continue;
      enrollments.push(buildEnrollmentRow(null, cid, course));
    }

    const summary = {
      totalEnrollments: uniqueEnrollments.length,
      byProgressStatus: { not_started: 0, in_progress: 0, completed: 0 },
      byResult: { pass: 0, fail: 0, pending: 0 },
      coursesWithGradeRecord: grades.length,
      coursesListed: 0,
    };

    for (const e of enrollments) {
      summary.byProgressStatus[e.courseProgressStatus]++;
      if (e.finalResult === 'pass') summary.byResult.pass++;
      else if (e.finalResult === 'fail') summary.byResult.fail++;
      else summary.byResult.pending++;
    }
    summary.coursesListed = enrollments.length;

    return {
      student: {
        id: user.id,
        email: user.email,
        firstName: user.firstName as Record<string, string>,
        lastName: user.lastName as Record<string, string>,
      },
      summary,
      enrollments,
    };
  }
}

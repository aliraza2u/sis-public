import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  CreateApplicationDto,
  ApplicationStatus,
  UpdateApplicationStatusDto,
} from './dto/application.dto';
import { StudentIdService } from '@/common/services/student-id.service';
import { I18nService } from 'nestjs-i18n';
import { ClsService } from 'nestjs-cls';
import { I18nNotFoundException, I18nBadRequestException } from '@/common/exceptions/i18n.exception';
import { EmailService } from '../email/email.service';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly studentIdService: StudentIdService,
    private readonly i18n: I18nService,
    private readonly emailService: EmailService,
  ) {}

  async apply(
    batchId: string,
    createDto: CreateApplicationDto,
    ipAddress: string,
    userAgent?: string,
  ) {
    const userId = this.cls.get('userId'); // Assuming logged in user
    const tenantId = this.cls.get('tenantId');
    // 1. Verify Batch
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new I18nNotFoundException('messages.batch.notFound');

    // 2. Check Enrollment Dates (Simplistic check)
    const now = new Date();
    if (now < batch.enrollmentStartDate || now > batch.enrollmentEndDate) {
      // throw new BadRequestException('Enrollment is not open for this batch');
      // For dev simplicity, maybe warn or skip. Let's enforce it.
      throw new I18nBadRequestException('messages.batch.enrollmentClosed');
    }

    // 3. Check for existing application
    const existingApp = await this.prisma.application.findFirst({
      where: {
        batchId,
        applicantId: userId,
      },
    });

    if (existingApp) {
      throw new I18nBadRequestException('messages.application.alreadyExists');
    }

    // 4. Generate Application Number (Internal)
    // Simple random or timestamp based for internal use
    const appNumber = `APP-${Date.now()}`;

    // 4. Fetch User Details to populate Personal Info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    if (!user) {
      throw new I18nBadRequestException('messages.user.notFound');
    }

    const personalInfoWithNames = {
      firstName: user.firstName,
      lastName: user.lastName,
      ...createDto.personalInfo,
    };

    return this.prisma.application.create({
      data: {
        batchId,
        courseId: batch.courseId,
        applicantId: userId,
        tenantId, // injected from CLS
        applicationNumber: appNumber,
        status: ApplicationStatus.SUBMITTED, // Auto-submit or draft?
        submittedAt: new Date(),
        ipAddress, // Server-extracted IP
        userAgent, // Server-extracted User-Agent
        ...createDto,
        personalInfo: personalInfoWithNames as any,
        guardianInfo: createDto.guardianInfo as any,
        educationInfo: createDto.educationInfo as any,
      },
    });
  }

  async findAll(batchId?: string) {
    return this.prisma.application.findMany({
      where: {
        ...(batchId ? { batchId } : {}),
      },
      include: {
        applicant: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        batch: {
          include: { course: { select: { title: true, code: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { batch: { include: { course: true, tenant: true } } },
    });
    if (!app) throw new I18nNotFoundException('messages.application.notFound');
    return app;
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, reviewerId: string) {
    const app = await this.findOne(id);

    // If approving, generate Roll Number if not exists
    let rollNumber = app.rollNumber;
    if (dto.status === ApplicationStatus.APPROVED && !rollNumber) {
      const { batch } = app;
      // IMPORTANT: We need tenant alias and course code.
      // They are nullable in schema, so handle fallback.
      rollNumber = await this.studentIdService.generateNextId(
        batch.tenantId,
        batch.tenant.alias,
        batch.course.code,
        batch.batchNumber,
      );
    }

    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
        rejectionReason: dto.rejectionReason,
        rollNumber: rollNumber, // Will be null if rejected or no change, or new ID if approved
      },
      include: {
        applicant: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            preferredLanguageCode: true,
          },
        },
        batch: { include: { course: { select: { title: true } } } },
      },
    });

    // Send approval email if status is approved
    if (dto.status === ApplicationStatus.APPROVED) {
      try {
        const lang = updatedApp.applicant.preferredLanguageCode || 'en';

        // Format applicant name
        const getName = (nameField: any, l: string) => {
          if (!nameField) return '';
          if (typeof nameField === 'string') return nameField;
          return nameField[l] || nameField.en || '';
        };

        const firstName = getName(updatedApp.applicant.firstName, lang);
        const lastName = getName(updatedApp.applicant.lastName, lang);
        const applicantName = `${firstName} ${lastName}`.trim() || 'Applicant';

        // Format course name (Localized if possible)
        const courseName =
          (updatedApp.batch.course.title as any)?.[lang] ||
          (updatedApp.batch.course.title as any)?.en ||
          (typeof updatedApp.batch.course.title === 'string'
            ? updatedApp.batch.course.title
            : 'Course');

        // Format batch name
        const batchName =
          (updatedApp.batch.name as any)?.[lang] ||
          (updatedApp.batch.name as any)?.en ||
          updatedApp.batch.name ||
          'N/A';

        // Format batch start date (Localized format)
        const batchStartDate = new Date(updatedApp.batch.startDate).toLocaleDateString(
          lang === 'ar' ? 'ar-SA' : 'en-US',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          },
        );

        await this.emailService.sendApplicationApprovalEmail(
          updatedApp.applicant.email,
          {
            applicantName,
            courseName,
            batchName,
            rollNumber: rollNumber || 'N/A',
            batchStartDate,
          },
          lang,
        );

        this.logger.log(`Approval email sent to ${updatedApp.applicant.email}`);
      } catch (error) {
        // Log error but don't fail the approval process
        this.logger.error('Failed to send approval email', error);
      }
    }

    return updatedApp;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { I18nInternalServerErrorException } from '@/common/exceptions/i18n.exception';

const STUDENT_ID_PADDING_LENGTH = 3;

@Injectable()
export class StudentIdService {
  private readonly logger = new Logger(StudentIdService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Generates a sequential Student ID (Roll Number) atomically.
   * Format: STU-{TenantAlias}-{CourseCode}-{BatchNumber}-{Sequence}
   * Example: STU-AM-SD-01-001
   */
  async generateNextId(
    tenantId: string,
    tenantAlias: string | null,
    courseCode: string | null,
    batchNumber: string,
  ): Promise<string> {
    // Fallback if aliases are missing (though they should be enforced at input level)
    const tAlias = tenantAlias || 'TNT';
    const cCode = courseCode || 'GEN';

    // Construct the context key
    const contextKey = `STU-${tAlias}-${cCode}-${batchNumber}`;

    try {
      const counter = await this.prisma.studentIdCounter.upsert({
        where: { contextKey },
        update: {
          currentCount: { increment: 1 },
        },
        create: {
          contextKey,
          currentCount: 1,
          tenant: { connect: { id: tenantId } },
        },
      });

      const sequence = counter.currentCount.toString().padStart(STUDENT_ID_PADDING_LENGTH, '0');
      return `${contextKey}-${sequence}`;
    } catch (error) {
      this.logger.error(`Failed to generate student ID for ${contextKey}`, error);
      throw new I18nInternalServerErrorException('messages.student.idGenerationFailed');
    }
  }
}

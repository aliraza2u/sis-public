import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class ApplicationRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.APPLICATION_RAW,
      dependencyOrder: 4,
      prismaModel: 'application',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'batch_id', prismaField: 'batchId', type: 'string', required: true },
        { name: 'course_id', prismaField: 'courseId', type: 'string', required: true },
        { name: 'applicant_id', prismaField: 'applicantId', type: 'string', required: true },
        {
          name: 'application_number',
          prismaField: 'applicationNumber',
          type: 'string',
          required: true,
        },
        { name: 'roll_number', prismaField: 'rollNumber', type: 'string' },
        { name: 'personal_info', prismaField: 'personalInfo', type: 'json' },
        { name: 'guardian_info', prismaField: 'guardianInfo', type: 'json' },
        { name: 'education_info', prismaField: 'educationInfo', type: 'json' },
        { name: 'status', prismaField: 'status', type: 'string', defaultValue: 'draft' },
        { name: 'submitted_at', prismaField: 'submittedAt', type: 'date' },
        { name: 'reviewed_by', prismaField: 'reviewedBy', type: 'string' },
        { name: 'reviewed_at', prismaField: 'reviewedAt', type: 'date' },
        { name: 'review_notes', prismaField: 'reviewNotes', type: 'string' },
        { name: 'rejection_reason', prismaField: 'rejectionReason', type: 'json' },
        { name: 'ip_address', prismaField: 'ipAddress', type: 'string' },
        { name: 'user_agent', prismaField: 'userAgent', type: 'string' },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['batch_id', 'course_id', 'applicant_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'APP_abc123',
      tenant_id: 'TNT_xyz789',
      batch_id: 'BAT_def456',
      course_id: 'CRS_ghi789',
      applicant_id: 'USR_jkl012',
      application_number: 'APP-2025-001',
      status: 'draft',
    };
  }
}

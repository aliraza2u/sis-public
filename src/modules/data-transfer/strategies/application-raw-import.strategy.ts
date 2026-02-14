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
      entityType: ImportEntityType.APPLICATION,
      dependencyOrder: 4,
      prismaModel: 'application',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'batchId', prismaField: 'batchId', type: 'string', required: true },
        { name: 'courseId', prismaField: 'courseId', type: 'string', required: true },
        { name: 'applicantId', prismaField: 'applicantId', type: 'string', required: true },
        {
          name: 'applicationNumber',
          prismaField: 'applicationNumber',
          type: 'string',
          required: true,
        },
        { name: 'rollNumber', prismaField: 'rollNumber', type: 'string' },
        { name: 'personalInfo', prismaField: 'personalInfo', type: 'json' },
        { name: 'guardianInfo', prismaField: 'guardianInfo', type: 'json' },
        { name: 'educationInfo', prismaField: 'educationInfo', type: 'json' },
        { name: 'status', prismaField: 'status', type: 'string', defaultValue: 'draft' },
        { name: 'submittedAt', prismaField: 'submittedAt', type: 'date' },
        { name: 'reviewedBy', prismaField: 'reviewedBy', type: 'string' },
        { name: 'reviewedAt', prismaField: 'reviewedAt', type: 'date' },
        { name: 'reviewNotes', prismaField: 'reviewNotes', type: 'string' },
        { name: 'rejectionReason', prismaField: 'rejectionReason', type: 'json' },
        { name: 'ipAddress', prismaField: 'ipAddress', type: 'string' },
        { name: 'userAgent', prismaField: 'userAgent', type: 'string' },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['batchId', 'courseId', 'applicantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'APP_abc123',
      tenantId: 'TNT_xyz789',
      batchId: 'BAT_def456',
      courseId: 'CRS_ghi789',
      applicantId: 'USR_jkl012',
      applicationNumber: 'APP-2025-001',
      status: 'draft',
    };
  }
}

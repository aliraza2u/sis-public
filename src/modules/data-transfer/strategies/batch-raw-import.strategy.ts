import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class BatchRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.BATCH_RAW,
      dependencyOrder: 3,
      prismaModel: 'batch',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'course_id', prismaField: 'courseId', type: 'string', required: true },
        { name: 'name', prismaField: 'name', type: 'json', required: true },
        { name: 'code', prismaField: 'code', type: 'string' },
        { name: 'batch_number', prismaField: 'batchNumber', type: 'string', required: true },
        { name: 'enrollment_start_date', prismaField: 'enrollmentStartDate', type: 'date' },
        { name: 'enrollment_end_date', prismaField: 'enrollmentEndDate', type: 'date' },
        { name: 'start_date', prismaField: 'startDate', type: 'date', required: true },
        { name: 'end_date', prismaField: 'endDate', type: 'date' },
        { name: 'max_students', prismaField: 'maxStudents', type: 'number' },
        { name: 'is_active', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['course_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'BAT_abc123',
      tenant_id: 'TNT_xyz789',
      course_id: 'CRS_def456',
      name: '{"en":"Spring 2025","ar":"ربيع 2025"}',
      code: 'SCI101-S25',
      batch_number: '01',
      start_date: '2025-03-01T00:00:00.000Z',
      end_date: '2025-06-30T23:59:59.000Z',
    };
  }
}

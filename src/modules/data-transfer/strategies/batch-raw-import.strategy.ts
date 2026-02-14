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
      entityType: ImportEntityType.BATCH,
      dependencyOrder: 3,
      prismaModel: 'batch',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'courseId', prismaField: 'courseId', type: 'string', required: true },
        { name: 'name', prismaField: 'name', type: 'json', required: true },
        { name: 'code', prismaField: 'code', type: 'string' },
        { name: 'batchNumber', prismaField: 'batchNumber', type: 'string', required: true },
        { name: 'enrollmentStartDate', prismaField: 'enrollmentStartDate', type: 'date' },
        { name: 'enrollmentEndDate', prismaField: 'enrollmentEndDate', type: 'date' },
        { name: 'startDate', prismaField: 'startDate', type: 'date', required: true },
        { name: 'endDate', prismaField: 'endDate', type: 'date' },
        { name: 'maxStudents', prismaField: 'maxStudents', type: 'number' },
        { name: 'isActive', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['courseId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'BAT_abc123',
      tenantId: 'TNT_xyz789',
      courseId: 'CRS_def456',
      name: '{"en":"Spring 2025","ar":"ربيع 2025"}',
      code: 'SCI101-S25',
      batchNumber: '01',
      startDate: '2025-03-01T00:00:00.000Z',
      endDate: '2025-06-30T23:59:59.000Z',
    };
  }
}

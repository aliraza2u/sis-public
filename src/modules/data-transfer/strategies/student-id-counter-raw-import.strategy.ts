import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class StudentIdCounterRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.STUDENT_ID_COUNTER_RAW,
      dependencyOrder: 1,
      prismaModel: 'studentIdCounter',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'context_key', prismaField: 'contextKey', type: 'string', required: true },
        { name: 'current_count', prismaField: 'currentCount', type: 'number', defaultValue: 0 },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
      ],
      foreignKeyFields: ['tenant_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'SIC_abc123',
      tenant_id: 'TNT_xyz789',
      context_key: '2025',
      current_count: '1000',
    };
  }
}

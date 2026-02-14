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
      entityType: ImportEntityType.STUDENT_ID_COUNTER,
      dependencyOrder: 1,
      prismaModel: 'studentIdCounter',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'contextKey', prismaField: 'contextKey', type: 'string', required: true },
        { name: 'currentCount', prismaField: 'currentCount', type: 'number', defaultValue: 0 },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
      ],
      foreignKeyFields: ['tenantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'SIC_abc123',
      tenantId: 'TNT_xyz789',
      contextKey: '2025',
      currentCount: '1000',
    };
  }
}

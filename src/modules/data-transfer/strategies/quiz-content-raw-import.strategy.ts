import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class QuizContentRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.QUIZ_CONTENT_RAW,
      dependencyOrder: 5,
      prismaModel: 'quizContent',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'module_item_id', prismaField: 'moduleItemId', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'passing_score', prismaField: 'passingScore', type: 'number', required: true },
        { name: 'time_limit_minutes', prismaField: 'timeLimitMinutes', type: 'number' },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['module_item_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'QC_abc123',
      module_item_id: 'MI_def456',
      tenant_id: 'TNT_xyz789',
      passing_score: '70',
      time_limit_minutes: '30',
    };
  }
}

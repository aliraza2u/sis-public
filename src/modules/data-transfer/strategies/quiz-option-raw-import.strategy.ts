import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class QuizOptionRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.QUIZ_OPTION_RAW,
      dependencyOrder: 7,
      prismaModel: 'quizOption',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'question_id', prismaField: 'questionId', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'option_text', prismaField: 'optionText', type: 'json', required: true },
        { name: 'is_correct', prismaField: 'isCorrect', type: 'boolean', defaultValue: false },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['question_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'QO_abc123',
      question_id: 'QQ_def456',
      tenant_id: 'TNT_xyz789',
      option_text: '{"en":"4","ar":"4"}',
      is_correct: 'true',
    };
  }
}

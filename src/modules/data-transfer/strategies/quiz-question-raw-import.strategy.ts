import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class QuizQuestionRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.QUIZ_QUESTION_RAW,
      dependencyOrder: 6,
      prismaModel: 'quizQuestion',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'quiz_id', prismaField: 'quizId', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'question_text', prismaField: 'questionText', type: 'json', required: true },
        {
          name: 'question_type',
          prismaField: 'questionType',
          type: 'string',
          defaultValue: 'multiple_choice',
        },
        { name: 'sort_order', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['quiz_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'QQ_abc123',
      quiz_id: 'QC_def456',
      tenant_id: 'TNT_xyz789',
      question_text: '{"en":"What is 2+2?","ar":"ما هو 2+2؟"}',
      question_type: 'multiple_choice',
      sort_order: '1',
    };
  }
}

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
      entityType: ImportEntityType.QUIZ_QUESTION,
      dependencyOrder: 6,
      prismaModel: 'quizQuestion',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'quizId', prismaField: 'quizId', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'questionText', prismaField: 'questionText', type: 'json', required: true },
        {
          name: 'questionType',
          prismaField: 'questionType',
          type: 'string',
          defaultValue: 'multiple_choice',
        },
        { name: 'sortOrder', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['quizId', 'tenantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'QQ_abc123',
      quizId: 'QC_def456',
      tenantId: 'TNT_xyz789',
      questionText: '{"en":"What is 2+2?","ar":"ما هو 2+2؟"}',
      questionType: 'multiple_choice',
      sortOrder: '1',
    };
  }
}

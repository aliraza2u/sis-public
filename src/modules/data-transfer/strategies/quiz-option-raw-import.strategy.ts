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
      entityType: ImportEntityType.QUIZ_OPTION,
      dependencyOrder: 7,
      prismaModel: 'quizOption',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'questionId', prismaField: 'questionId', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'optionText', prismaField: 'optionText', type: 'json', required: true },
        { name: 'isCorrect', prismaField: 'isCorrect', type: 'boolean', defaultValue: false },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['questionId', 'tenantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'QO_abc123',
      questionId: 'QQ_def456',
      tenantId: 'TNT_xyz789',
      optionText: '{"en":"4","ar":"4"}',
      isCorrect: 'true',
    };
  }
}

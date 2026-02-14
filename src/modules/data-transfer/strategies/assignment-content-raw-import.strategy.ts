import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class AssignmentContentRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.ASSIGNMENT_CONTENT,
      dependencyOrder: 5,
      prismaModel: 'assignmentContent',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'moduleItemId', prismaField: 'moduleItemId', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'instructions', prismaField: 'instructions', type: 'json', required: true },
        { name: 'dueDate', prismaField: 'dueDate', type: 'date' },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['moduleItemId', 'tenantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'AC_abc123',
      moduleItemId: 'MI_def456',
      tenantId: 'TNT_xyz789',
      instructions: '{"en":"Complete the assignment","ar":"أكمل الواجب"}',
      dueDate: '2025-02-01T23:59:59.000Z',
    };
  }
}

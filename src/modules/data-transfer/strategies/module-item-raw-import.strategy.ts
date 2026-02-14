import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class ModuleItemRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.MODULE_ITEM,
      dependencyOrder: 4,
      prismaModel: 'moduleItem',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'moduleId', prismaField: 'moduleId', type: 'string', required: true },
        { name: 'activityTypeId', prismaField: 'activityTypeId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json', required: true },
        { name: 'description', prismaField: 'description', type: 'json' },
        { name: 'sortOrder', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'completionRules', prismaField: 'completionRules', type: 'json' },
        { name: 'isPublished', prismaField: 'isPublished', type: 'boolean', defaultValue: false },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['moduleId', 'activityTypeId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'MI_abc123',
      tenantId: 'TNT_xyz789',
      moduleId: 'MOD_def456',
      activityTypeId: 'AT_ghi789',
      title: '{"en":"Lesson 1","ar":"الدرس 1"}',
      sortOrder: '1',
      isPublished: 'true',
    };
  }
}

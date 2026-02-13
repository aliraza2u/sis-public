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
      entityType: ImportEntityType.MODULE_ITEM_RAW,
      dependencyOrder: 4,
      prismaModel: 'moduleItem',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'module_id', prismaField: 'moduleId', type: 'string', required: true },
        { name: 'activity_type_id', prismaField: 'activityTypeId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json', required: true },
        { name: 'sort_order', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'is_published', prismaField: 'isPublished', type: 'boolean', defaultValue: false },
        { name: 'is_required', prismaField: 'isRequired', type: 'boolean', defaultValue: false },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['module_id', 'activity_type_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'MI_abc123',
      tenant_id: 'TNT_xyz789',
      module_id: 'MOD_def456',
      activity_type_id: 'AT_ghi789',
      title: '{"en":"Lesson 1","ar":"الدرس 1"}',
      sort_order: '1',
      is_published: 'true',
      is_required: 'true',
    };
  }
}

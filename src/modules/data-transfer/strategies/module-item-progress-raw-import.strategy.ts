import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class ModuleItemProgressRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.MODULE_ITEM_PROGRESS_RAW,
      dependencyOrder: 5,
      prismaModel: 'moduleItemProgress',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'user_id', prismaField: 'userId', type: 'string', required: true },
        { name: 'module_item_id', prismaField: 'moduleItemId', type: 'string', required: true },
        { name: 'status', prismaField: 'status', type: 'string', required: true },
        { name: 'progress_percent', prismaField: 'progressPercent', type: 'number', defaultValue: 0 },
        { name: 'completed_at', prismaField: 'completedAt', type: 'date' },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['user_id', 'module_item_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'MIP_abc123',
      tenant_id: 'TNT_xyz789',
      user_id: 'USR_def456',
      module_item_id: 'MI_ghi789',
      status: 'completed',
      progress_percent: '100',
      completed_at: '2025-01-15T10:00:00.000Z',
    };
  }
}

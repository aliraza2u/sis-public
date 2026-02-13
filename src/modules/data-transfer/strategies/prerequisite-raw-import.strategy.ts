import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class PrerequisiteRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.PREREQUISITE_RAW,
      dependencyOrder: 5,
      prismaModel: 'prerequisite',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'module_item_id', prismaField: 'moduleItemId', type: 'string', required: true },
        { name: 'prerequisite_item_id', prismaField: 'prerequisiteItemId', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
      ],
      foreignKeyFields: ['module_item_id', 'prerequisite_item_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'PRQ_abc123',
      module_item_id: 'MI_def456',
      prerequisite_item_id: 'MI_ghi789',
      tenant_id: 'TNT_xyz789',
    };
  }
}

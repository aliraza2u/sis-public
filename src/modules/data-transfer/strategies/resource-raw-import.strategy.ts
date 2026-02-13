import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class ResourceRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.RESOURCE_RAW,
      dependencyOrder: 5,
      prismaModel: 'resource',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'module_item_id', prismaField: 'moduleItemId', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json' },
        { name: 'resource_type', prismaField: 'resourceType', type: 'string', required: true },
        { name: 'resource_url', prismaField: 'resourceUrl', type: 'string', required: true },
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
      id: 'RES_abc123',
      module_item_id: 'MI_def456',
      tenant_id: 'TNT_xyz789',
      title: '{"en":"Resource Title","ar":"عنوان المادة"}',
      resource_type: 'pdf',
      resource_url: 'https://example.com/resource.pdf',
    };
  }
}

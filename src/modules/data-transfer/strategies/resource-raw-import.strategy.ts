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
      entityType: ImportEntityType.RESOURCE,
      dependencyOrder: 5,
      prismaModel: 'resource',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'moduleItemId', prismaField: 'moduleItemId', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json' },
        { name: 'resourceType', prismaField: 'resourceType', type: 'string', required: true },
        { name: 'resourceUrl', prismaField: 'resourceUrl', type: 'string', required: true },
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
      id: 'RES_abc123',
      moduleItemId: 'MI_def456',
      tenantId: 'TNT_xyz789',
      title: '{"en":"Resource Title","ar":"عنوان المادة"}',
      resourceType: 'pdf',
      resourceUrl: 'https://example.com/resource.pdf',
    };
  }
}

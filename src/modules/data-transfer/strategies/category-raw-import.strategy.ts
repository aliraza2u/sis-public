import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class CategoryRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.CATEGORY,
      dependencyOrder: 1,
      prismaModel: 'category',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'name', prismaField: 'name', type: 'json', required: true },
        { name: 'description', prismaField: 'description', type: 'json' },
        { name: 'slug', prismaField: 'slug', type: 'string', required: true },
        { name: 'isActive', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'sortOrder', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
      ],
      foreignKeyFields: ['tenantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'CAT_abc123',
      tenantId: 'TNT_xyz789',
      name: '{"en":"Technology","ar":"التكنولوجيا"}',
      slug: 'technology',
      isActive: 'true',
      sortOrder: '0',
    };
  }
}

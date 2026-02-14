import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class TenantRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.TENANT,
      dependencyOrder: 0,
      prismaModel: 'tenant',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'name', prismaField: 'name', type: 'json', required: true },
        { name: 'slug', prismaField: 'slug', type: 'string', required: true },
        { name: 'alias', prismaField: 'alias', type: 'string' },
        { name: 'logoUrl', prismaField: 'logoUrl', type: 'string' },
        { name: 'primaryColor', prismaField: 'primaryColor', type: 'string' },
        { name: 'secondaryColor', prismaField: 'secondaryColor', type: 'string' },
        { name: 'contactEmail', prismaField: 'contactEmail', type: 'string', required: true },
        { name: 'contactPhone', prismaField: 'contactPhone', type: 'string' },
        { name: 'address', prismaField: 'address', type: 'json' },
        { name: 'website', prismaField: 'website', type: 'string' },
        { name: 'defaultLanguageCode', prismaField: 'defaultLanguageCode', type: 'string' },
        { name: 'enabledLanguages', prismaField: 'enabledLanguages', type: 'array' },
        { name: 'timezone', prismaField: 'timezone', type: 'string' },
        { name: 'isActive', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'settings', prismaField: 'settings', type: 'json' },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'TNT_abc123',
      name: '{"en":"My Org","ar":"منظمتي"}',
      slug: 'my-org',
      alias: 'MO',
      contactEmail: 'contact@example.com',
      isActive: 'true',
    };
  }
}

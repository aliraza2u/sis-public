import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class ModuleRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.MODULE,
      dependencyOrder: 3,
      prismaModel: 'module',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'courseId', prismaField: 'courseId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json', required: true },
        { name: 'description', prismaField: 'description', type: 'json' },
        { name: 'sortOrder', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'isPublished', prismaField: 'isPublished', type: 'boolean', defaultValue: false },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['courseId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'MOD_abc123',
      tenantId: 'TNT_xyz789',
      courseId: 'CRS_def456',
      title: '{"en":"Module 1","ar":"الوحدة 1"}',
      sortOrder: '1',
      isPublished: 'true',
    };
  }
}

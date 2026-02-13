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
      entityType: ImportEntityType.MODULE_RAW,
      dependencyOrder: 3,
      prismaModel: 'module',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'course_id', prismaField: 'courseId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json', required: true },
        { name: 'description', prismaField: 'description', type: 'json' },
        { name: 'sort_order', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'is_published', prismaField: 'isPublished', type: 'boolean', defaultValue: false },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['course_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'MOD_abc123',
      tenant_id: 'TNT_xyz789',
      course_id: 'CRS_def456',
      title: '{"en":"Module 1","ar":"الوحدة 1"}',
      sort_order: '1',
      is_published: 'true',
    };
  }
}

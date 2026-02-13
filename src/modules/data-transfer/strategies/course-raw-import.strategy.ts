import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class CourseRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.COURSE_RAW,
      dependencyOrder: 2,
      prismaModel: 'course',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'category_id', prismaField: 'categoryId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json', required: true },
        { name: 'code', prismaField: 'code', type: 'string' },
        { name: 'description', prismaField: 'description', type: 'json' },
        { name: 'short_description', prismaField: 'shortDescription', type: 'json' },
        { name: 'thumbnail_url', prismaField: 'thumbnailUrl', type: 'string' },
        { name: 'level', prismaField: 'level', type: 'string' },
        { name: 'prerequisites', prismaField: 'prerequisites', type: 'json' },
        { name: 'learning_outcomes', prismaField: 'learningOutcomes', type: 'json' },
        { name: 'required_documents', prismaField: 'requiredDocuments', type: 'json' },
        { name: 'is_published', prismaField: 'isPublished', type: 'boolean', defaultValue: false },
        { name: 'is_featured', prismaField: 'isFeatured', type: 'boolean', defaultValue: false },
        { name: 'is_active', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'sort_order', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['tenant_id', 'category_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'CRS_abc123',
      tenant_id: 'TNT_xyz789',
      category_id: 'CAT_def456',
      title: '{"en":"Introduction to Science","ar":"مقدمة في العلوم"}',
      code: 'SCI101',
      is_published: 'true',
    };
  }
}

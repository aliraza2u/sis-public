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
      entityType: ImportEntityType.COURSE,
      dependencyOrder: 2,
      prismaModel: 'course',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json', required: true },
        { name: 'description', prismaField: 'description', type: 'json' },
        { name: 'shortDescription', prismaField: 'shortDescription', type: 'json' },
        { name: 'thumbnailUrl', prismaField: 'thumbnailUrl', type: 'string' },
        { name: 'categoryId', prismaField: 'categoryId', type: 'string', required: true },
        { name: 'level', prismaField: 'level', type: 'string' },
        { name: 'prerequisites', prismaField: 'prerequisites', type: 'json' },
        { name: 'learningOutcomes', prismaField: 'learningOutcomes', type: 'json' },
        { name: 'requiredDocuments', prismaField: 'requiredDocuments', type: 'json' },
        { name: 'isPublished', prismaField: 'isPublished', type: 'boolean', defaultValue: false },
        { name: 'isFeatured', prismaField: 'isFeatured', type: 'boolean', defaultValue: false },
        { name: 'isActive', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'sortOrder', prismaField: 'sortOrder', type: 'number', defaultValue: 0 },
        { name: 'code', prismaField: 'code', type: 'string' },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
        { name: 'updatedAt', prismaField: 'updatedAt', type: 'date' },
        { name: 'createdBy', prismaField: 'createdBy', type: 'string' },
        { name: 'updatedBy', prismaField: 'updatedBy', type: 'string' },
        { name: 'deletedAt', prismaField: 'deletedAt', type: 'date' },
        { name: 'deletedBy', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['tenantId', 'categoryId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'CRS_abc123',
      tenantId: 'TNT_xyz789',
      categoryId: 'CAT_def456',
      title: '{"en":"Introduction to Science","ar":"مقدمة في العلوم"}',
      code: 'SCI101',
      isPublished: 'true',
    };
  }
}

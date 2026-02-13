import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class LessonContentRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.LESSON_CONTENT_RAW,
      dependencyOrder: 5,
      prismaModel: 'lessonContent',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'module_item_id', prismaField: 'moduleItemId', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'video_url', prismaField: 'videoUrl', type: 'string' },
        { name: 'title', prismaField: 'title', type: 'json' },
        { name: 'thumbnail_url', prismaField: 'thumbnailUrl', type: 'string' },
        { name: 'description', prismaField: 'description', type: 'json' },
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
      id: 'LC_abc123',
      module_item_id: 'MI_def456',
      tenant_id: 'TNT_xyz789',
      video_url: 'https://example.com/video.mp4',
      title: '{"en":"Lesson Title","ar":"عنوان الدرس"}',
    };
  }
}

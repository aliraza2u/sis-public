import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class ActivityTypeRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.ACTIVITY_TYPE_RAW,
      dependencyOrder: 1,
      prismaModel: 'activityType',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'tenant_id', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'code', prismaField: 'code', type: 'string', required: true },
        { name: 'title', prismaField: 'title', type: 'json', required: true },
        { name: 'description', prismaField: 'description', type: 'json' },
        { name: 'is_active', prismaField: 'isActive', type: 'boolean', defaultValue: true },
        { name: 'created_at', prismaField: 'createdAt', type: 'date' },
        { name: 'updated_at', prismaField: 'updatedAt', type: 'date' },
        { name: 'created_by', prismaField: 'createdBy', type: 'string' },
        { name: 'updated_by', prismaField: 'updatedBy', type: 'string' },
        { name: 'deleted_at', prismaField: 'deletedAt', type: 'date' },
        { name: 'deleted_by', prismaField: 'deletedBy', type: 'string' },
      ],
      foreignKeyFields: ['tenant_id'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'AT_abc123',
      tenant_id: 'TNT_xyz789',
      code: 'lesson',
      title: '{"en":"Lesson","ar":"درس"}',
      is_active: 'true',
    };
  }
}

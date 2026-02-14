import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class PrerequisiteRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.PREREQUISITE,
      dependencyOrder: 5,
      prismaModel: 'prerequisite',
      fields: [
        { name: 'id', prismaField: 'id', type: 'string', required: true },
        { name: 'moduleItemId', prismaField: 'moduleItemId', type: 'string', required: true },
        {
          name: 'prerequisiteItemId',
          prismaField: 'prerequisiteItemId',
          type: 'string',
          required: true,
        },
        { name: 'tenantId', prismaField: 'tenantId', type: 'string', required: true },
        { name: 'createdAt', prismaField: 'createdAt', type: 'date' },
      ],
      foreignKeyFields: ['moduleItemId', 'prerequisiteItemId', 'tenantId'],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      id: 'PRQ_abc123',
      moduleItemId: 'MI_def456',
      prerequisiteItemId: 'MI_ghi789',
      tenantId: 'TNT_xyz789',
    };
  }
}

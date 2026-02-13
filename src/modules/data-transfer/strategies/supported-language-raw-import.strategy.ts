import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class SupportedLanguageRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return {
      entityType: ImportEntityType.SUPPORTED_LANGUAGE_RAW,
      dependencyOrder: 0,
      prismaModel: 'supportedLanguage',
      primaryKeyField: 'code', // Uses 'code' as PK, not 'id'
      fields: [
        { name: 'code', prismaField: 'code', type: 'string', required: true },
        { name: 'name_english', prismaField: 'nameEnglish', type: 'string', required: true },
        { name: 'name_native', prismaField: 'nameNative', type: 'string' },
        { name: 'is_rtl', prismaField: 'isRtl', type: 'boolean', defaultValue: false },
        { name: 'is_active', prismaField: 'isActive', type: 'boolean', defaultValue: true },
      ],
    };
  }

  getSampleRow(): Record<string, string> {
    return {
      code: 'en',
      name_english: 'English',
      name_native: 'English',
      is_rtl: 'false',
      is_active: 'true',
    };
  }
}

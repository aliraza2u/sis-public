import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';
import { STRATEGY_CONFIGS } from '../config/import-strategies.config';

@Injectable()
export class TenantRawImportStrategy extends BaseRawImportStrategy {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return STRATEGY_CONFIGS[ImportEntityType.TENANT].config;
  }

  getSampleRow(): Record<string, string> {
    return STRATEGY_CONFIGS[ImportEntityType.TENANT].sampleRow;
  }
}

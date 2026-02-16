import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BaseRawImportStrategy, StrategyConfig } from './base-raw-import.strategy';

@Injectable()
export class GenericRawImportStrategy extends BaseRawImportStrategy {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly config: StrategyConfig,
    private readonly sampleRowData: Record<string, string>,
  ) {
    super(prisma);
  }

  protected getConfig(): StrategyConfig {
    return this.config;
  }

  getSampleRow(): Record<string, string> {
    return this.sampleRowData;
  }
}

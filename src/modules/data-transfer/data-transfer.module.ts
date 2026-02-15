import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DataTransferController } from './data-transfer.controller';
import { DataTransferService } from './data-transfer.service';
import {
  CsvParserService,
  FileStorageService,
  ImportJobService,
  ImportProcessorService,
  ExportService,
} from './services';
import { CleanupService } from './cleanup.service';
import {
  RAW_IMPORT_STRATEGIES,
  TenantRawImportStrategy,
  UserRawImportStrategy,
  GenericRawImportStrategy,
  RawImportStrategy,
} from './strategies';
import { STRATEGY_CONFIGS } from './config/import-strategies.config';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DataTransferController],
  providers: [
    DataTransferService,
    CsvParserService,
    FileStorageService,
    ImportJobService,
    ImportProcessorService,
    ExportService,
    CleanupService,

    // Explicit strategies (required for SystemService injection)
    TenantRawImportStrategy,
    UserRawImportStrategy,

    // Factory to provide all raw import strategies
    {
      provide: RAW_IMPORT_STRATEGIES,
      useFactory: (
        prisma: PrismaService,
        tenantStrategy: TenantRawImportStrategy,
        userStrategy: UserRawImportStrategy,
      ) => {
        const strategies: RawImportStrategy[] = [];

        // Add explicit strategies
        strategies.push(tenantStrategy);
        strategies.push(userStrategy);

        // Add generic strategies for all other entities
        Object.values(STRATEGY_CONFIGS).forEach(({ config, sampleRow }) => {
          // Skip if already handled explicitly
          if (
            config.entityType === ImportEntityType.TENANT ||
            config.entityType === ImportEntityType.USER
          ) {
            return;
          }

          strategies.push(new GenericRawImportStrategy(prisma, config, sampleRow));
        });

        return strategies;
      },
      inject: [PrismaService, TenantRawImportStrategy, UserRawImportStrategy],
    },
  ],
  exports: [DataTransferService, CsvParserService, TenantRawImportStrategy, UserRawImportStrategy],
})
export class DataTransferModule {}

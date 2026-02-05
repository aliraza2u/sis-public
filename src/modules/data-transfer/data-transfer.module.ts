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
import { IMPORT_STRATEGIES, UserImportStrategy, TenantImportStrategy } from './strategies';
import { CleanupService } from './cleanup.service';

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
    // Import strategies
    UserImportStrategy,
    TenantImportStrategy,
    {
      provide: IMPORT_STRATEGIES,
      useFactory: (userStrategy: UserImportStrategy, tenantStrategy: TenantImportStrategy) => [
        userStrategy,
        tenantStrategy,
      ],
      inject: [UserImportStrategy, TenantImportStrategy],
    },
  ],
  exports: [DataTransferService],
})
export class DataTransferModule {}

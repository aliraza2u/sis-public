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
import {
  IMPORT_STRATEGIES,
  UserImportStrategy,
  TenantImportStrategy,
  ModuleItemProgressImportStrategy,
} from './strategies';
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
    ModuleItemProgressImportStrategy,
    {
      provide: IMPORT_STRATEGIES,
      useFactory: (
        userStrategy: UserImportStrategy,
        tenantStrategy: TenantImportStrategy,
        moduleItemProgressStrategy: ModuleItemProgressImportStrategy,
      ) => [userStrategy, tenantStrategy, moduleItemProgressStrategy],
      inject: [UserImportStrategy, TenantImportStrategy, ModuleItemProgressImportStrategy],
    },
  ],
  exports: [DataTransferService],
})
export class DataTransferModule {}

import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CsvParserService } from '@/modules/data-transfer/services/csv-parser.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { TenantRawImportStrategy } from '@/modules/data-transfer/strategies/tenant-raw-import.strategy';
import { UserRawImportStrategy } from '@/modules/data-transfer/strategies/user-raw-import.strategy';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvParser: CsvParserService,
    private readonly tenantStrategy: TenantRawImportStrategy,
    private readonly userStrategy: UserRawImportStrategy,
  ) {}

  async bootstrapImport(file: Express.Multer.File, entityType: ImportEntityType) {
    // 1. Check if DB is empty for the specific entity type
    if (entityType === ImportEntityType.TENANT) {
      const tenantCount = await this.prisma.tenant.count();
      if (tenantCount > 0) {
        throw new ForbiddenException(
          'Tenant table is not empty. Bootstrap import for tenants is only allowed for fresh migrations.',
        );
      }
    } else if (entityType === ImportEntityType.USER) {
      const userCount = await this.prisma.user.count();
      if (userCount > 0) {
        throw new ForbiddenException(
          'User table is not empty. Bootstrap import for users is only allowed for fresh migrations.',
        );
      }
    }

    // 2. Validate Entity Type
    if (![ImportEntityType.TENANT, ImportEntityType.USER].includes(entityType)) {
      throw new BadRequestException('Only tenant and user are allowed for bootstrap import');
    }

    // 3. Parse CSV
    const { rows, totalRows } = await this.csvParser.parseBuffer(file.buffer);

    if (totalRows === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // 4. Get Strategy
    const strategy =
      entityType === ImportEntityType.TENANT ? this.tenantStrategy : this.userStrategy;

    // 5. Validate Rows
    const validatedRows: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = await strategy.validate(row, i + 1); // Row index 1-based
      if (validation.isValid && validation.normalizedData) {
        validatedRows.push({ rowIndex: i + 1, data: validation.normalizedData });
      } else {
        errors.push(...validation.errors);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    // 6. Import Batch
    // For bootstrap, we process all at once.
    // Tenant ID is not needed for Tenant Raw Import, and for User Raw Import it comes from CSV.
    // So we can pass a dummy string or rely on the strategy ignoring it or using CSV data.
    const result = await strategy.importBatch(validatedRows, 'bootstrap-system');

    this.logger.log(
      `Bootstrap import completed for ${entityType}. Success: ${result.successCount}, Errors: ${result.errors.length}`,
    );

    return {
      success: true,
      message: `Bootstrap import completed. Imported ${result.successCount} records.`,
      errors: result.errors,
    };
  }
}

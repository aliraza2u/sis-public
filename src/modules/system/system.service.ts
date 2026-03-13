import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CsvParserService } from '@/modules/data-transfer/services/csv-parser.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { TenantRawImportStrategy } from '@/modules/data-transfer/strategies/tenant-raw-import.strategy';
import { UserRawImportStrategy } from '@/modules/data-transfer/strategies/user-raw-import.strategy';
import {
  I18nForbiddenException,
  I18nBadRequestException,
} from '@/common/exceptions/i18n.exception';
import { t_ } from '@/common/helpers/i18n.helper';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  private readonly maxFileSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvParser: CsvParserService,
    private readonly tenantStrategy: TenantRawImportStrategy,
    private readonly userStrategy: UserRawImportStrategy,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.getOrThrow<number>('dataTransfer.maxFileSize');
  }

  async bootstrapImport(file: Express.Multer.File, entityType: ImportEntityType) {
    // 1. Check if DB is empty for the specific entity type
    if (entityType === ImportEntityType.TENANT) {
      const tenantCount = await this.prisma.tenant.count();
      if (tenantCount > 0) {
        throw new I18nForbiddenException('bootstrap.databaseNotEmpty');
      }
    } else if (entityType === ImportEntityType.USER) {
      const userCount = await this.prisma.user.count();
      if (userCount > 0) {
        throw new I18nForbiddenException('bootstrap.databaseNotEmpty');
      }
    }

    // 2. Validate Entity Type
    if (![ImportEntityType.TENANT, ImportEntityType.USER].includes(entityType)) {
      throw new I18nBadRequestException('dataTransfer.invalidFile');
    }

    // 3. Parse CSV
    let rows: any[];
    let totalRows: number;

    try {
      const result = await this.csvParser.parseBuffer(file.buffer);
      rows = result.rows;
      totalRows = result.totalRows;
    } catch (error: any) {
      this.logger.error(`CSV parsing failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    if (totalRows === 0) {
      throw new I18nBadRequestException('dataTransfer.emptyFile');
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

    const result = await strategy.importBatch(validatedRows, 'bootstrap-system');

    this.logger.log(
      `Bootstrap import completed for ${entityType}. Success: ${result.successCount}, Errors: ${result.errors.length}`,
    );

    return {
      success: true,
      message: t_('bootstrap.success', { count: result.successCount }),
      errors: result.errors,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CsvParserService } from '@/modules/data-transfer/services/csv-parser.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';
import { extractLocalized } from '../utils/data-transfer.utils';

interface ExportColumn {
  key: string;
  header: string;
  transform?: (value: unknown) => string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvParser: CsvParserService,
  ) {}

  /**
   * Export users to CSV
   */
  async exportUsers(tenantId: string): Promise<string> {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    // Note: Using separate columns for each language to preserve multi-language data
    const records = users.map((user) => ({
      email: user.email,
      firstName_en: extractLocalized(user.firstName, 'en'),
      firstName_ar: extractLocalized(user.firstName, 'ar'),
      lastName_en: extractLocalized(user.lastName, 'en'),
      lastName_ar: extractLocalized(user.lastName, 'ar'),
      role: user.role,
      phone: user.phone || '',
    }));

    return this.csvParser.generateCsv(records);
  }

  /**
   * Export tenants to CSV
   */
  async exportTenants(): Promise<string> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Note: Using separate columns for each language to preserve multi-language data
    const records = tenants.map((tenant) => ({
      name_en: extractLocalized(tenant.name, 'en'),
      name_ar: extractLocalized(tenant.name, 'ar'),
      slug: tenant.slug,
      contactEmail: tenant.contactEmail || '',
      contactPhone: tenant.contactPhone || '',
      website: tenant.website || '',
    }));

    return this.csvParser.generateCsv(records);
  }

  /**
   * Export data by entity type
   */
  async export(entityType: ImportEntityType, tenantId: string): Promise<string> {
    switch (entityType) {
      case ImportEntityType.USER:
        return this.exportUsers(tenantId);
      case ImportEntityType.TENANT:
        return this.exportTenants();
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Get the filename for export
   */
  getExportFilename(entityType: ImportEntityType): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${entityType}-export-${timestamp}.csv`;
  }

  /**
   * Transform a record to export format
   */
  private transformRecord(
    record: Record<string, unknown>,
    columns: ExportColumn[],
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const col of columns) {
      const value = record[col.key];
      if (col.transform) {
        result[col.header] = col.transform(value);
      } else {
        result[col.header] = value != null ? String(value) : '';
      }
    }

    return result;
  }
}

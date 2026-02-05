import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CsvParserService } from '@/modules/data-transfer/services/csv-parser.service';
import { ImportEntityType } from '@/common/enums/import-entity-type.enum';

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
      firstName_en: this.extractLocalized(user.firstName, 'en'),
      firstName_ar: this.extractLocalized(user.firstName, 'ar'),
      lastName_en: this.extractLocalized(user.lastName, 'en'),
      lastName_ar: this.extractLocalized(user.lastName, 'ar'),
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
      name_en: this.extractLocalized(tenant.name, 'en'),
      name_ar: this.extractLocalized(tenant.name, 'ar'),
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

  /**
   * Extract localized value from JSON field
   */
  private extractLocalized(value: unknown, locale: string): string {
    if (!value || typeof value !== 'object') return '';
    const obj = value as Record<string, string>;
    return obj[locale] || obj['en'] || Object.values(obj)[0] || '';
  }

  /**
   * Format date for export
   */
  private formatDate(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }
}

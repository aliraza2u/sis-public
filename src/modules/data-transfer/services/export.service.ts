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

    const columns: ExportColumn[] = [
      { key: 'id', header: 'id' },
      { key: 'email', header: 'email' },
      {
        key: 'firstName',
        header: 'firstName',
        transform: (v) => this.extractLocalized(v, 'en'),
      },
      {
        key: 'lastName',
        header: 'lastName',
        transform: (v) => this.extractLocalized(v, 'en'),
      },
      { key: 'phone', header: 'phone' },
      { key: 'role', header: 'role' },
      { key: 'emailVerified', header: 'emailVerified', transform: (v) => String(v) },
      { key: 'isActive', header: 'isActive', transform: (v) => String(v) },
      { key: 'createdAt', header: 'createdAt', transform: (v) => this.formatDate(v) },
    ];

    const records = users.map((user) => this.transformRecord(user, columns));
    const headers = columns.map((c) => c.header);

    return this.csvParser.generateCsv(records, headers);
  }

  /**
   * Export tenants to CSV
   */
  async exportTenants(): Promise<string> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const columns: ExportColumn[] = [
      { key: 'id', header: 'id' },
      {
        key: 'name',
        header: 'name',
        transform: (v) => this.extractLocalized(v, 'en'),
      },
      { key: 'slug', header: 'slug' },
      { key: 'contactEmail', header: 'contactEmail' },
      { key: 'contactPhone', header: 'contactPhone' },
      { key: 'website', header: 'website' },
      { key: 'isActive', header: 'isActive', transform: (v) => String(v) },
      { key: 'createdAt', header: 'createdAt', transform: (v) => this.formatDate(v) },
    ];

    const records = tenants.map((tenant) => this.transformRecord(tenant, columns));
    const headers = columns.map((c) => c.header);

    return this.csvParser.generateCsv(records, headers);
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

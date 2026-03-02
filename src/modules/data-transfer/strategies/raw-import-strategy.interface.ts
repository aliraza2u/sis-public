import { ImportStrategy } from './import-strategy.interface';

/**
 * Extended interface for raw ID-based imports (system-to-system sync)
 */
export interface RawImportStrategy extends ImportStrategy {
  /**
   * Get dependency order for import sequencing
   * Lower numbers import first (0 = no dependencies)
   * e.g., Tenants = 0, Users = 1, Courses = 2, etc.
   */
  getDependencyOrder(): number;

  /**
   * Indicates this is a raw import (uses database IDs)
   */
  isRawImport(): boolean;
}

/**
 * Parse raw CSV value from Admission Portal format
 */
export class RawValueParser {
  /**
   * Parse JSON string to object
   * Admission Portal exports JSON fields as stringified JSON
   */
  static parseJson(value: unknown): object | null {
    if (!value || value === '') return null;
    if (typeof value === 'object') return value as object;

    try {
      return JSON.parse(String(value));
    } catch {
      // If not valid JSON, treat as plain text and wrap in default language
      return { en: String(value) };
    }
  }

  /**
   * Parse ISO 8601 date string to Date
   * Admission Portal exports dates as ISO strings
   */
  static parseDate(value: unknown): Date | null {
    if (!value || value === '') return null;

    const date = new Date(String(value));
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Parse boolean from string
   * Admission Portal exports booleans as "true"/"false" strings
   */
  static parseBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    if (str === '') return null;
    return str === 'true' || str === '1' || str === 'yes';
  }

  /**
   * Parse integer, returning null for empty strings
   */
  static parseInt(value: unknown): number | null {
    if (!value || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : Math.floor(num);
  }

  /**
   * Parse number (int or float), returning null for empty strings
   */
  static parseNumber(value: unknown): number | null {
    if (!value || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Parse string, converting empty strings to null
   */
  static parseString(value: unknown): string | null {
    if (!value || value === '') return null;
    return String(value).trim();
  }

  /**
   * Parse array from JSON string
   */
  static parseArray(value: unknown): unknown[] | null {
    if (!value || value === '') return null;
    if (Array.isArray(value)) return value;

    const strValue = String(value).trim();
    if (strValue === '') return null;

    try {
      const parsed = JSON.parse(strValue);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      // Fallback for comma-separated strings (common in CSV export)
      if (strValue.includes(',')) {
        const items = strValue
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        return items.length > 0 ? items : null;
      }
      // Single value fallback
      return [strValue];
    }
  }
}

/**
 * Token for injecting raw import strategies
 */
export const RAW_IMPORT_STRATEGIES = 'RAW_IMPORT_STRATEGIES';

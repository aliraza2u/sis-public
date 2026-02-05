import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export interface CsvError {
  row: number;
  field: string;
  message: string;
  data: Record<string, unknown>;
}

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

  /**
   * Parse a CSV buffer into structured data
   */
  async parseBuffer(buffer: Buffer): Promise<ParsedCsvResult> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, unknown>[] = [];
      let headers: string[] = [];

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle BOM in CSV files
        relax_column_count: true,
      });

      parser.on('readable', () => {
        let record: Record<string, unknown>;
        while ((record = parser.read()) !== null) {
          rows.push(record);
        }
      });

      parser.on('headers', (hdrs: string[]) => {
        headers = hdrs;
      });

      parser.on('error', (error) => {
        this.logger.error('CSV parsing error:', error);
        reject(error);
      });

      parser.on('end', () => {
        // Extract headers from first record if not captured by event
        if (headers.length === 0 && rows.length > 0) {
          headers = Object.keys(rows[0]);
        }
        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      });

      // Create readable stream from buffer and pipe to parser
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(parser);
    });
  }

  /**
   * Validate that required headers are present
   */
  validateHeaders(
    actualHeaders: string[],
    expectedHeaders: string[],
  ): { isValid: boolean; missingHeaders: string[] } {
    const normalizedActual = actualHeaders.map((h) => h.toLowerCase().trim());
    const missingHeaders: string[] = [];

    for (const expected of expectedHeaders) {
      if (!normalizedActual.includes(expected.toLowerCase())) {
        // Check if it's a required header (not optional like phone, website)
        missingHeaders.push(expected);
      }
    }

    return {
      isValid: missingHeaders.length === 0,
      missingHeaders,
    };
  }

  /**
   * Generate a CSV string from error records
   */
  async generateFailedRowsCsv(errors: CsvError[], originalHeaders: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      // Add error columns to headers
      const headers = [...originalHeaders, 'error_row', 'error_field', 'error_message'];

      const records = errors.map((error) => {
        const record: Record<string, unknown> = { ...error.data };
        record['error_row'] = error.row;
        record['error_field'] = error.field;
        record['error_message'] = error.message;
        return record;
      });

      stringify(records, { header: true, columns: headers }, (err, output) => {
        if (err) {
          this.logger.error('CSV stringify error:', err);
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  }

  /**
   * Generate a CSV string from data records for export
   */
  async generateCsv(records: Record<string, unknown>[], columns?: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: Parameters<typeof stringify>[1] = {
        header: true,
      };

      if (columns) {
        options.columns = columns;
      }

      stringify(records, options, (err, output) => {
        if (err) {
          this.logger.error('CSV stringify error:', err);
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  }
}

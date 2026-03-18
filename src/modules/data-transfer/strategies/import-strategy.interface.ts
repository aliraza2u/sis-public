/**
 * Interface for entity-specific import strategies
 */
export interface ImportStrategy {
  /**
   * Get the entity type this strategy handles
   */
  getEntityType(): string;

  /**
   * Validate a single row of data
   * @param row The row data to validate
   * @param rowIndex The row index (for error reporting)
   * @param existingData Optional context for duplicate checking within the batch
   * @returns Validation result with errors if any
   */
  validate(
    row: Record<string, unknown>,
    rowIndex: number,
    existingData?: Set<string>,
  ): Promise<ValidationResult>;

  /**
   * Import a batch of validated rows
   * @param rows The validated rows to import
   * @param tenantId The tenant ID to associate with imported records
   * @returns Import result with success count and any errors
   */
  importBatch(rows: ValidatedRow[], tenantId: string): Promise<BatchImportResult>;

  /**
   * Get the expected CSV headers for this entity type
   */
  getExpectedHeaders(): string[];

  /**
   * Headers not required on the CSV. Defaults to only the last header from getExpectedHeaders().
   */
  getOptionalHeaders?(): string[];

  /**
   * Get a sample CSV row for template download
   */
  getSampleRow(): Record<string, string>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  normalizedData?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedRow {
  rowIndex: number;
  data: Record<string, unknown>;
}

export interface BatchImportResult {
  successCount: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  data: Record<string, unknown>;
}

/**
 * Token for injecting import strategies
 */
export const IMPORT_STRATEGIES = 'IMPORT_STRATEGIES';

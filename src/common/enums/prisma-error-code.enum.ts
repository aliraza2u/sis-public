/**
 * Common Prisma Client error codes.
 *
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export enum PrismaErrorCode {
  /**
   * The provided value for the column is too long for the column's type. Column: {column_name}
   */
  ValueTooLong = 'P2000',

  /**
   * Unique constraint failed on the {constraint}
   */
  UniqueConstraintVioaltion = 'P2002',

  /**
   * Foreign key constraint failed on the field: {field_name}
   */
  ForeignKeyConstraintViolation = 'P2003',

  /**
   * Inconsistent column data: {message}
   */
  InconsistentData = 'P2023',

  /**
   * An operation failed because it depends on one or more records that were required but not found. {cause}
   */
  RecordNotFound = 'P2025',

  /**
   * Transaction API Error
   */
  TransactionAPIError = 'P2028',
}

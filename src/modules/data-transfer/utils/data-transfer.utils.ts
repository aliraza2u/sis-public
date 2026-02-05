/**
 * Parse multi-language field - supports both JSON strings and plain text
 * JSON format: {"en":"Admin","ar":"مدير"}
 * Plain text: Admin (will be converted to {en: "Admin"})
 */
export function parseMultiLangField(
  value: string,
  fieldName: string,
  errors: { field: string; message: string }[],
): Record<string, string> {
  // Check if it's a JSON string
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      const parsed = JSON.parse(value);

      // Validate it's an object with language keys
      if (typeof parsed !== 'object' || parsed === null) {
        errors.push({
          field: fieldName,
          message: `Invalid JSON format for ${fieldName}`,
        });
        return { en: value };
      }

      // Accept any languages provided - no specific requirements
      return parsed;
    } catch (error) {
      errors.push({
        field: fieldName,
        message: `Failed to parse JSON in ${fieldName}: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
      });
      // Fallback: treat as plain text
      return { en: value };
    }
  } else {
    // Plain text - convert to English-only
    return { en: value };
  }
}

/**
 * Extract localized value from JSON field
 */
export function extractLocalized(value: unknown, locale: string): string {
  if (!value || typeof value !== 'object') return '';
  const obj = value as Record<string, string>;
  return obj[locale] || obj['en'] || Object.values(obj)[0] || '';
}

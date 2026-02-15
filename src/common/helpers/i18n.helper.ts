/**
 * Simple helper to mark a message for i18n translation.
 * The I18nResponseInterceptor will automatically translate this before sending the response.
 *
 * @param key - Translation key from messages.json (e.g., 'messages.auth.loggedOut')
 * @returns Marked string that will be auto-translated by interceptor
 *
 * @example
 * ```typescript
 * import { t } from '@/common/helpers/i18n.helper';
 *
 * return { message: t('messages.auth.loggedOut') };
 * // Will be translated to: { message: 'Successfully logged out' }
 * ```
 */
export function t(key: string): string {
  return `__i18n:${key}`;
}

/**
 * Helper for i18n messages with arguments/interpolation.
 * Supported by I18nResponseInterceptor.
 *
 * @param key - Translation key
 * @param args - Arguments for interpolation
 */
export function t_(key: string, args: Record<string, any>): string {
  return JSON.stringify({ __i18n__: key, args });
}

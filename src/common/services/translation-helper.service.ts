import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

/**
 * Helper service for i18n translations in non-exception contexts
 * (e.g., success messages, email subjects)
 */
@Injectable()
export class TranslationHelperService {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Synchronous method that returns a translation key wrapped in a marker.
   * An interceptor will detect and translate these before sending the response.
   */
  t(key: string, args?: Record<string, any>): string {
    // Return a JSON marker that will be intercepted and translated
    return JSON.stringify({ __i18n__: key, args: args || {} });
  }

  /**
   * Async method for cases where we need immediate translation
   * (e.g., email subjects that are sent immediately)
   */
  async translate(key: string, args?: Record<string, any>): Promise<string> {
    return this.i18n.translate(key, { args: args || {} });
  }

  async translateAll(keys: Record<string, string | { key: string; args?: any }>, lang?: string) {
    const results: Record<string, string> = {};
    for (const [prop, value] of Object.entries(keys)) {
      if (typeof value === 'string') {
        results[prop] = (await this.i18n.translate(value, { lang })) as any;
      } else {
        results[prop] = (await this.i18n.translate(value.key, {
          args: value.args,
          lang,
        })) as any;
      }
    }
    return results;
  }

  getLocalizedText(obj: any, preferredLang?: string): string {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (preferredLang && obj[preferredLang]) {
      return obj[preferredLang];
    }
    return obj['en'] || obj['ar'] || Object.values(obj)[0] || '';
  }

  getLocale(lang?: string): string {
    if (lang === 'ar') {
      return 'ar-SA';
    }
    return 'en-US';
  }
}

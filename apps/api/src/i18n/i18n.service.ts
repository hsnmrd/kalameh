import { Injectable } from '@nestjs/common';
import type { SupportedLocale } from '@workspace/types';
import { fa } from './locales/fa';
import { en } from './locales/en';
import type { TranslationDictionary, TranslationKey } from './i18n.types';

@Injectable()
export class I18nService {
  private readonly translations: Record<
    SupportedLocale,
    TranslationDictionary
  > = {
    fa,
    en,
  };

  t(
    key: TranslationKey,
    locale?: SupportedLocale,
    params?: Record<string, string | number>,
  ): string {
    const validLocale: SupportedLocale = locale === 'en' ? 'en' : 'fa';
    const dict = this.translations[validLocale];
    const [section, messageKey] = key.split('.') as [
      keyof TranslationDictionary,
      string,
    ];

    const sectionObj = dict[section] as Record<string, string> | undefined;
    let message = sectionObj?.[messageKey];

    if (!message) {
      const fallbackSection = this.translations.fa[section] as
        Record<string, string> | undefined;
      message = fallbackSection?.[messageKey] ?? key;
    }

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        message = message.replace(
          new RegExp(`{${paramKey}}`, 'g'),
          String(paramValue),
        );
      }
    }

    return message;
  }
}

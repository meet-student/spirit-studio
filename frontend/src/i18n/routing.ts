import { defaultLocale } from './default';

export const locales = ['zh', 'en'] as const;

export type Locale = (typeof locales)[number];

export { defaultLocale };
export const localeStorageKey = 'eval-locale';

export const localeLabels: Record<Locale, string> = {
  zh: '中文',
  en: 'EN',
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh' || value === 'en';
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return defaultLocale;
  if (isLocale(value)) return value;
  return value.toLowerCase().startsWith('zh') ? 'zh' : value.toLowerCase().startsWith('en') ? 'en' : defaultLocale;
}

import { defaultLocale, isLocale, localeStorageKey, type Locale } from './routing';

export function getRequestLocale(): Locale {
  try {
    const stored = typeof window === 'undefined' ? null : window.localStorage?.getItem(localeStorageKey);
    return isLocale(stored) ? stored : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export function saveRequestLocale(locale: Locale) {
  try {
    if (typeof window !== 'undefined') window.localStorage?.setItem(localeStorageKey, locale);
  } catch {
    // Storage can be unavailable in private browsing or restricted webviews.
  }
}

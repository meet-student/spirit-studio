import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enAbout from './locales/en/about.json';
import enContact from './locales/en/contact.json';
import enFaq from './locales/en/faq.json';
import enNavigation from './locales/en/navigation.json';
import enHome from './locales/en/home.json';
import enPrivacy from './locales/en/privacy.json';
import enSettings from './locales/en/settings.json';
import enSignin from './locales/en/signin.json';
import enSignup from './locales/en/signup.json';
import enWorkspace from './locales/en/workspace.json';
import zhAbout from './locales/zh/about.json';
import zhCommon from './locales/zh/common.json';
import zhContact from './locales/zh/contact.json';
import zhFaq from './locales/zh/faq.json';
import zhNavigation from './locales/zh/navigation.json';
import zhHome from './locales/zh/home.json';
import zhPrivacy from './locales/zh/privacy.json';
import zhSettings from './locales/zh/settings.json';
import zhSignin from './locales/zh/signin.json';
import zhSignup from './locales/zh/signup.json';
import zhWorkspace from './locales/zh/workspace.json';
import { defaultLocale } from './default';
import { getRequestLocale } from './request';
import { locales, localeStorageKey, normalizeLocale } from './routing';

export const resources = {
  en: {
    about: enAbout,
    common: enCommon,
    contact: enContact,
    faq: enFaq,
    home: enHome,
    navigation: enNavigation,
    privacy: enPrivacy,
    settings: enSettings,
    signin: enSignin,
    signup: enSignup,
    workspace: enWorkspace,
  },
  zh: {
    about: zhAbout,
    common: zhCommon,
    contact: zhContact,
    faq: zhFaq,
    home: zhHome,
    navigation: zhNavigation,
    privacy: zhPrivacy,
    settings: zhSettings,
    signin: zhSignin,
    signup: zhSignup,
    workspace: zhWorkspace,
  },
} as const;

function updateDocumentLanguage(language: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalizeLocale(language) === 'zh' ? 'zh-CN' : 'en';
  }
}

updateDocumentLanguage(getRequestLocale());

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getRequestLocale(),
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    ns: ['common', 'navigation', 'home', 'settings', 'about', 'contact', 'faq', 'privacy', 'signin', 'signup', 'workspace'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: localeStorageKey,
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  });

i18n.on('languageChanged', updateDocumentLanguage);

export default i18n;

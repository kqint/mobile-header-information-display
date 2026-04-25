import localesData from 'virtual:locales';
import type { AppLocale } from './types';

type LocaleDict = Record<string, string | Record<string, unknown>>;
type LocalesMap = Record<string, LocaleDict>;

const locales = localesData as LocalesMap;

function getSystemLocale(): string {
  const lang = navigator.language;
  if (lang === 'zh-CN' || lang === 'zh' || lang.startsWith('zh-')) {
    return 'zh-CN';
  }
  return 'en';
}

function deepGet(obj: LocaleDict, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') {
      return path;
    }
    current = (current as LocaleDict)[key];
    if (typeof current === 'string') {
      return current;
    }
  }
  return path;
}

let currentLocale = getSystemLocale();

export function setLocale(locale: AppLocale): void {
  currentLocale = locale === 'auto' ? getSystemLocale() : locale;
}

export function t(key: string): string {
  const locale = locales[currentLocale];
  if (!locale) {
    return key;
  }
  return deepGet(locale, key);
}

import en from './en.json';
import tw from './zh-TW.json';
export type Locale = 'zh-CN' | 'zh-TW' | 'en';
export const locales: Locale[] = ['zh-CN', 'zh-TW', 'en'];
const dictionaries: Record<string, Record<string, string>> = { en, 'zh-TW': tw };
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
export function resolveLocale(query: string | null, stored: string | null, browser: string): Locale {
  for (const value of [query, stored]) if (locales.includes(value as Locale)) return value as Locale;
  if (/^zh-(tw|hk|mo|hant)/i.test(browser)) return 'zh-TW';
  return /^zh/i.test(browser) ? 'zh-CN' : 'en';
}
export function translate(text: string, locale: Locale): string {
  if (locale === 'zh-CN' || !text.trim()) return text;
  const key = normalize(text), dictionary = dictionaries[locale];
  let result = dictionary[key];
  if (!result) {
    for (const [pattern, target] of Object.entries(dictionary)) {
      if (!pattern.includes('{0}')) continue;
      const parts = pattern.split(/\{\d+\}/);
      const escaped = parts.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const match = key.match(new RegExp('^' + escaped.join('(.*?)') + '$'));
      if (match) { result = target.replace(/\{(\d+)\}/g, (_, n) => match[Number(n) + 1]); break; }
    }
  }
  if (!result) return text;
  return (text.match(/^\s*/)?.[0] ?? '') + result + (text.match(/\s*$/)?.[0] ?? '');
}

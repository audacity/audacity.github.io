import en from "./en.json";

/*
  English-only for the Audacity 4 release. The de/fr/es dictionaries and the
  footer's language selector live on the i18n/main branch until the copy has
  been through a translator — shipping machine-drafted marketing copy was the
  thing to avoid, not the plumbing.

  useTranslations keeps its signature and every t() call site keeps working, so
  restoring the other locales is a matter of adding the imports back here and
  widening the locales array in astro.config.mjs.
*/
const translations = { en } as const;

export type Locale = keyof typeof translations;
export const locales: Locale[] = ["en"];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
};

export function useTranslations(locale: string | undefined) {
  const lang = (locale as Locale) ?? defaultLocale;
  const dict = translations[lang] ?? translations[defaultLocale];
  return function t(key: keyof typeof en): string {
    return (dict as typeof en)[key] ?? en[key] ?? key;
  };
}

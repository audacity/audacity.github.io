import en from "./en.json";
import fr from "./fr.json";
import de from "./de.json";
import es from "./es.json";

const translations = { en, fr, de, es } as const;

export type Locale = keyof typeof translations;
export const locales: Locale[] = ["en", "fr", "de", "es"];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  fr: { name: "Français", flag: "🇫🇷" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  es: { name: "Español", flag: "🇪🇸" },
};

export function useTranslations(locale: string | undefined) {
  const lang = (locale as Locale) ?? defaultLocale;
  const dict = translations[lang] ?? translations[defaultLocale];
  return function t(key: keyof typeof en): string {
    return (dict as typeof en)[key] ?? en[key] ?? key;
  };
}

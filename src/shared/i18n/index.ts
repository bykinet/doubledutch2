import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ko from "./locales/ko.json";
import ja from "./locales/ja.json";

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ko", // Korean as default
  fallbackLng: "ko",
  interpolation: {
    escapeValue: false,
  },
});

export type SupportedLanguage = "ko" | "en" | "ja";

export const getNextLanguage = (currentLang: string): SupportedLanguage => {
  if (currentLang.startsWith("ko")) return "en";
  if (currentLang.startsWith("en")) return "ja";
  return "ko";
};

export const getLanguageLabel = (currentLang: string, short: boolean = false): string => {
  if (currentLang.startsWith("ko")) return short ? "KO" : "한국어";
  if (currentLang.startsWith("en")) return short ? "EN" : "English";
  if (currentLang.startsWith("ja")) return short ? "JA" : "日本語";
  return short ? "KO" : "한국어";
};

export default i18n;

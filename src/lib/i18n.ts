import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/locales/en.json";
import id from "@/locales/id.json";

const isBrowser = typeof window !== "undefined";

if (!i18n.isInitialized) {
  const chain = i18n.use(initReactI18next);
  if (isBrowser) {
    chain.use(LanguageDetector);
  }
  chain.init({
    // Force "id" on the server so resources are available during SSR.
    // In the browser, let LanguageDetector decide.
    lng: isBrowser ? undefined : "id",
    resources: {
      en: { landing: en.landing },
      id: { landing: id.landing },
    },
    fallbackLng: "id",
    supportedLngs: ["en", "id"],
    defaultNS: "landing",
    ns: ["landing"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "mitan-lang",
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
    ...({ initImmediate: false } as object),
  });
}

export default i18n;

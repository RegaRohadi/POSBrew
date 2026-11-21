import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import en from "./locales/en"
import id from "./locales/id"

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: id },
      en: { translation: en },
    },
    fallbackLng: "id",
    supportedLngs: ["id", "en"],
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "posbrew-lang",
    },
    interpolation: {
      escapeValue: false,
    },
  })

document.documentElement.lang = i18n.language

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language
  localStorage.setItem("posbrew-lang", language)
})

export default i18n

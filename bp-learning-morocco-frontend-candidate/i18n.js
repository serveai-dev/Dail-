import { fr } from "./locales/fr.js";

const LOCALES = { fr };
let lang = "fr";
const warned = new Set();

export function setLang(next) {
  lang = LOCALES[next] ? next : "fr";
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir();
  }
}

export function getLang() { return lang; }
export function dir() { return lang === "ar" ? "rtl" : "ltr"; }

export function t(key, vars = {}) {
  let value = LOCALES[lang][key];
  if (value === undefined) {
    value = fr[key] ?? key;
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`i18n: missing ${lang}.${key}`);
    }
  }
  return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", { dateStyle: "long", numberingSystem: "latn" }).format(new Date(iso));
}

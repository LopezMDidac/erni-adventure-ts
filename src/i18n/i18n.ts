export type Locale = "en" | "es";

import enUI from "./locales/en/ui.json";
import esUI from "./locales/es/ui.json";
import enLore from "./locales/en/lore.json";
import esLore from "./locales/es/lore.json";

type Dict = {
  ui: Record<string, any>;
  lore: Record<string, Array<{ who?: string; text: string }>>;
};

const DICT: Record<Locale, Dict> = {
  en: { ui: enUI, lore: enLore as any },
  es: { ui: esUI, lore: esLore as any }
};

let current: Locale = detectLang();

export function t(key: string, params: Record<string, any> = {}): string {
  const value = key.split(".").reduce<any>((acc, k) => (acc && k in acc ? acc[k] : undefined), DICT[current].ui);
  const s = (value === undefined ? key : String(value));
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

export function lore(key: string): Array<{ who?: string; text: string }> {
  return DICT[current].lore[key] ?? [];
}

export function getLang(): Locale { return current; }

export function setLang(lang: Locale) {
  current = lang;
  try {
    localStorage.setItem("erni_lang", lang);
    const raw = localStorage.getItem("erni_adventure_save_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.settings = parsed.settings || {};
      parsed.settings.lang = lang;
      localStorage.setItem("erni_adventure_save_v1", JSON.stringify(parsed));
    }
  } catch {}
}

function detectLang(): Locale {
  try {
    const raw = localStorage.getItem("erni_adventure_save_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.settings?.lang && (parsed.settings.lang === "en" || parsed.settings.lang === "es")) {
        return parsed.settings.lang;
      }
    }
  } catch {}
  const l = (localStorage.getItem("erni_lang") as Locale) || "en";
  return (l === "es" || l === "en") ? l : "en";
}

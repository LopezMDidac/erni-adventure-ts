export type AvatarSaved = { headTex?: number; torsoTex?: number };

export type SaveData = {
  version: number;
  unlocked: string[];
  best: Record<string, number>;
  avatar: AvatarSaved;
  settings: { sfx: number; music: number; lang: "en" | "es" };
};

export const SAVE_KEY = "erni_adventure_save_v3";

const DEFAULT_SAVE: SaveData = {
  version: 1,
  unlocked: ["Ch1AccessDenied"],
  best: {},
  avatar: {},
  settings: { sfx: 1, music: 1, lang: "en" },
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw);
    parsed.settings = parsed.settings || {};
    if (!parsed.settings.lang) parsed.settings.lang = "en";
    return { ...DEFAULT_SAVE, ...parsed };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveSave(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function unlockLevel(data: SaveData, id: string) {
  if (!data.unlocked.includes(id)) data.unlocked.push(id);
}

export function recordBest(id: string, value: number) {
  const data = loadSave();
  if (!(id in data.best)) data.best[id] = value;
  else data.best[id] = Math.max(data.best[id], value);
  saveSave(data);
}

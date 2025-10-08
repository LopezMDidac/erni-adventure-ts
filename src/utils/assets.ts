// src/utils/assets.ts
export const ASSET = (p: string) =>
  `${import.meta.env.BASE_URL}${p.replace(/^\//, "")}`;

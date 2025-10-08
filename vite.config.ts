// vite.config.ts
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/erni-adventure-ts/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});

// vite.config.ts
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  // replace with your repository name
  base: "/<your-repo-name>/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});

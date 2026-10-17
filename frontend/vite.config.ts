import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { seoPlugin } from "./vite-plugin-seo";
import { publishedPagesOnly } from "./vite-plugin-content";

export default defineConfig({
  plugins: [react(), publishedPagesOnly(), seoPlugin()],
  build: {
    outDir: "dist",
  },
  server: {
    port: 3000,
  },
});

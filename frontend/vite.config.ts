import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { seoPlugin } from "./vite-plugin-seo";
import { publishedPagesOnly } from "./vite-plugin-content";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    publishedPagesOnly(),
    seoPlugin(),
    // Client build only, and only where CI provides a token. The maps are
    // deleted after upload so Pages never publishes them.
    !isSsrBuild && process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          release: { name: process.env.VITE_SENTRY_RELEASE },
          sourcemaps: { filesToDeleteAfterUpload: ["dist/**/*.map"] },
        })
      : null,
  ],
  build: {
    outDir: "dist",
    sourcemap: !isSsrBuild,
  },
  server: {
    port: 3000,
  },
}));

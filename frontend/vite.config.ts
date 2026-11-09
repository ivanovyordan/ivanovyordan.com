import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { seoPlugin } from "./vite-plugin-seo";
import { publishedPagesOnly } from "./vite-plugin-content";

/**
 * The kit's scripts (menu, motion, the scroll moment) read the DOM once at load. In the pre-rendered
 * build the page is already there; in dev the root is empty until React renders, so dev leaves the tags
 * out and index.tsx loads the scripts after the first render.
 */
const kitAfterRender = (): Plugin => ({
  name: "kit-after-render",
  apply: "serve",
  transformIndexHtml: (html) => html.replace(/<script type="module" src="\/kit\/[^"]+"><\/script>\s*/g, ""),
});

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    publishedPagesOnly(),
    seoPlugin(),
    kitAfterRender(),
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

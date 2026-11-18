import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { seoPlugin } from "./vite-plugin-seo";
import { publishedPagesOnly } from "./vite-plugin-content";

/**
 * The production pages are the pre-rendered HTML and ship no React. client.ts reads that DOM once at
 * load; in dev the root is empty until React renders, so dev swaps the script for dev.tsx, which
 * renders the app and then starts client.ts.
 */
const devRender = (): Plugin => ({
  name: "dev-render",
  apply: "serve",
  transformIndexHtml: (html) => html.replace('src="/client.ts"', 'src="/dev.tsx"'),
});

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    publishedPagesOnly(),
    seoPlugin(),
    devRender(),
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

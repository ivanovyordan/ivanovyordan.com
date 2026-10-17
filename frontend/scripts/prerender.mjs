/**
 * Post-build step: writes one HTML file per route into dist/, each with its
 * own <head> and server-rendered body, plus sitemap.xml, the feeds and
 * llms.txt. Runs after `vite build` and `vite build --ssr entry-server.tsx
 * --outDir .prerender` (see package.json).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const serverDir = join(root, ".prerender");

const HEAD_MARKER = "<!--app-head-->";
const HTML_MARKER = "<!--app-html-->";

const { listRoutes, render, generateFiles } = await import(
  pathToFileURL(join(serverDir, "entry-server.js")).href
);

const template = readFileSync(join(dist, "index.html"), "utf-8");
if (!template.includes(HEAD_MARKER) || !template.includes(HTML_MARKER)) {
  throw new Error(
    `dist/index.html must contain ${HEAD_MARKER} and ${HTML_MARKER}`
  );
}

// The shell's default <title> and description come from site.json (see
// vite-plugin-seo.ts). Each route brings its own, so drop the defaults.
const shell = template
  .replace(/[ \t]*<title>[^<]*<\/title>\s*/, "")
  .replace(/[ \t]*<meta name="description"[^>]*>\s*/, "");

function write(relativePath, content) {
  const target = join(dist, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf-8");
}

const routes = listRoutes();
for (const route of routes) {
  const { head, html } = render(route);
  // Function replacers: a literal replacement string would expand "$&" and
  // friends inside the rendered HTML.
  const page = shell
    .replace(HEAD_MARKER, () => head)
    .replace(HTML_MARKER, () => html);
  write(route.file, page);
}

const files = generateFiles();
for (const [name, content] of Object.entries(files)) {
  write(name, content);
}

rmSync(serverDir, { recursive: true, force: true });

console.log(
  `✓ Pre-rendered ${routes.length} routes (${routes
    .map((r) => r.path)
    .join(", ")}) and wrote ${Object.keys(files).join(", ")}`
);

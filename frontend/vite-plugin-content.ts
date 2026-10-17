import type { Plugin } from "vite";
import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

const VIRTUAL_ID = "virtual:published-pages";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/**
 * Keep unpublished pages out of the bundle.
 *
 * `utils/pages.ts` imports `virtual:published-pages`, which this plugin
 * builds from `content/pages/*.json` at build time with only the pages
 * whose `published` is not `false`. An unpublished page is never imported,
 * so neither its content nor its file name reaches the public JS. (An
 * `import.meta.glob` would list every file by path, even with the module
 * replaced.)
 */
export function publishedPagesOnly(): Plugin {
  const pagesDir = resolve(process.cwd(), "content", "pages");

  return {
    name: "vite-plugin-published-pages",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      this.addWatchFile(pagesDir);

      const published = readdirSync(pagesDir)
        .filter((file) => file.endsWith(".json"))
        .sort()
        .filter((file) => {
          const page = JSON.parse(readFileSync(join(pagesDir, file), "utf-8")) as {
            published?: boolean;
          };
          return page.published !== false;
        });

      const imports = published.map(
        (file, i) =>
          `import page${i} from ${JSON.stringify(join(pagesDir, file).replace(/\\/g, "/"))};`
      );
      const names = published.map((_, i) => `page${i}`);
      return `${imports.join("\n")}\nexport default [${names.join(", ")}];\n`;
    },
  };
}

# ivanovyordan.com

Personal website and blog for Yordan Ivanov. I help experienced data professionals who already do a lead's job get their priorities agreed, their work seen and the title to match.
Static React front end on Cloudflare Pages, a small Cloudflare Worker behind the
AI assistant on the coaching page.

## Stack

### Frontend (`frontend/`)
- **React 19**, **TypeScript**, **Vite 7**, **Tailwind CSS 4**, **React Router**
- **PageCMS** edits the content in `frontend/content/` (`.pages.yml` is the schema)
- **Build-time pre-rendering**: every published route is written as its own
  HTML file with its head tags and content, then hydrated in the browser.
  The build also generates `sitemap.xml`, `feed.xml`, `atom.xml`, `llms.txt`
  and a real `404.html`
- **Newsletter signup** is the Substack embed for [Data Gibberish](https://www.datagibberish.com)
- **Booking** is TidyCal: the free discovery call is embedded on `/coaching` and
  `/contact`, the paid packages live at [book.ivanovyordan.com](https://book.ivanovyordan.com/)
- Google Analytics and Facebook Pixel behind a cookie-consent banner, Sentry
  for errors, dark mode, accessibility basics

### Backend (`backend/`)
- **Cloudflare Worker** serving `POST /ai` for the website widget and a remote
  **MCP server** at `/mcp` (one tool, `ask_yordan`)
- **Yordan's digital twin**: Gemini generation grounded in a Pinecone index of
  his writing (`backend/data/prompt.md` is the system prompt). Website visitors
  get 10 questions; annual Data Gibberish subscribers get full access
- **Cloudflare D1** logs questions and backs the MCP per-IP daily limit

## Local Development

Requires Node.js 20 or later.

```bash
npm install
cp env.example .env   # VITE_API_URL, VITE_SITE_URL, VITE_MAX_QUESTIONS, Gemini and Pinecone keys
npm run dev:backend   # Worker on http://localhost:8787
npm run dev:frontend  # site on http://localhost:3000
```

Other scripts: `npm run dev` (both), `npm run build:frontend` (production
build with pre-rendering into `frontend/dist`), `npm run build --workspace=backend`
(typecheck), `npm run deploy:backend`.

## Project Structure

```
frontend/
  components/      React components (blocks/ are the CMS section types)
  content/         site.json, navigation.json, pages/*.json, posts/*.md
  pages/           Route components
  utils/           Content loaders, route metadata, feed/sitemap/llms.txt generators
  entry-server.tsx Build-time render entry
  scripts/         prerender.mjs, the post-build step
backend/
  functions/       Worker: HTTP shell, pipeline, MCP server, rate limit
  data/            Digital twin system prompt
  migrations/      D1 schema
```

## Content

Edit through PageCMS or directly in `frontend/content/`:

- **Site config**: `site.json` (name, tagline, description, booking and
  newsletter URLs, social links, analytics)
- **Pages**: `pages/*.json`; `published: false` keeps a page out of the
  routes, the bundle, the sitemap and `llms.txt`
- **Posts**: `posts/*.md` with front matter
- **Navigation**: `navigation.json`

## Deployment

Push to `main` and GitHub Actions deploys the front end to Cloudflare Pages
and the Worker to Cloudflare Workers. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

MIT License - see [LICENSE](./LICENSE) for details.

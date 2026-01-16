# ivanovyordan.com

Personal website and blog for Yordan Ivanov, Head of Data Engineering. Built with modern web technologies and featuring an AI-powered digital assistant.

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **React Router** - Client-side routing
- **PageCMS** - Content management system

### Backend
- **Cloudflare Workers** - Serverless runtime
- **Google Gemini AI** - AI assistant and embeddings
- **Pinecone** - Vector database for knowledge retrieval
- **Cloudflare KV** - Rate limiting storage

### Features
- 📝 Blog with markdown posts
- 🤖 AI Digital Twin assistant
- 📧 Newsletter integration (Listmonk)
- 📊 Analytics (Google Analytics, Facebook Pixel)
- 🍪 GDPR-compliant cookie consent
- 🐛 Error tracking (Sentry)
- ♿ Accessibility features
- 📱 Responsive design
- 🌙 Dark mode support

## Local Development

### Prerequisites

- Node.js 20 or later (required for Vite 7 and Wrangler 4)
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ivanovyordan.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your local configuration:
   - `VITE_API_URL` - Backend URL (default: `http://localhost:8787`)
   - `VITE_SITE_URL` - Site URL (default: `http://localhost:3000`)
   - `GEMINI_API_KEY` - Google Gemini API key
   - `PINECONE_BASE_URL` - Pinecone API base URL
   - `PINECONE_API_KEY` - Pinecone API key

4. **Start the backend** (runs on port 8787)
   ```bash
   npm run dev:backend
   ```

5. **Start the frontend** (runs on port 3000)
   ```bash
   npm run dev:frontend
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Scripts

- `npm run dev:frontend` - Start frontend dev server
- `npm run dev:backend` - Start backend dev server
- `npm run dev` - Start both frontend and backend
- `npm run build:frontend` - Build frontend for production
- `npm run deploy:backend` - Deploy backend to Cloudflare Workers

## Project Structure

```
ivanovyordan.com/
├── frontend/          # React application
│   ├── components/    # React components
│   ├── content/       # CMS content files
│   ├── pages/         # Page components
│   └── utils/         # Utility functions
├── backend/           # Cloudflare Worker
│   ├── functions/     # Worker code
│   └── data/         # AI prompt templates
└── .github/           # GitHub Actions workflows
```

## Content Management

Content is managed through PageCMS. Edit files in `frontend/content/` or use the CMS interface:

- **Pages**: `frontend/content/pages/`
- **Posts**: `frontend/content/posts/`
- **Site config**: `frontend/content/site.json`
- **Navigation**: `frontend/content/navigation.json`

## Deployment

This site uses automated CI/CD with GitHub Actions. On push to `main`:

1. Frontend builds and deploys to **Cloudflare Pages**
2. Backend deploys to **Cloudflare Workers**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## License

MIT License - see [LICENSE](./LICENSE) for details.

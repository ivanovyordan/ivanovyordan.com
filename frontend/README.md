# Nova - Minimalist Personal Website Theme

A clean, high-performance minimalistic theme for personal websites, focused on content and professional branding. It features an integrated "AI Digital Twin" powered by Google Gemini and Cloudflare Workers.

## Project Structure

This project is organized as a workspace:

- **frontend/**: A React application built with Vite and Tailwind CSS.
- **backend/**: A Cloudflare Worker that handles AI inference and knowledge retrieval from Cloudflare R2.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

Install dependencies from the project root:

```bash
npm install
```

## Local Development

To run the full stack locally:

1.  **Start the Backend** (Runs on port 8787):

    ```bash
    npm run dev:backend
    ```

2.  **Start the Frontend** (Runs on port 3000):

    ```bash
    npm run dev:frontend
    ```

    By default, the frontend will connect to `http://localhost:8787`.

## Deployment

### 1. Deploying the Frontend

You can deploy the frontend to any static site host (Netlify, Vercel, Cloudflare Pages).

1.  **Build the project**:

    ```bash
    npm run build:frontend
    ```

    This generates a `frontend/dist` folder containing your static assets.

2.  **Configure Environment Variables**:
    On your hosting platform, set the following variable so your live site connects to your live backend:

    - `VITE_API_URL`: The URL of your deployed Cloudflare Worker (e.g., `https://your-worker-name.your-subdomain.workers.dev`).

### 2. Deploying the Backend

1.  **Setup Cloudflare**:
    Ensure you have a Cloudflare account and have installed Wrangler (`npm install -g wrangler`).

2.  **Add Secrets**:
    Add your Google Gemini API key to the worker's secrets:

    ```bash
    cd backend
    npx wrangler secret put API_KEY
    ```

3.  **Deploy**:

    ```bash
    npm run deploy
    ```

4.  **R2 Knowledge Base**:
    - Create an R2 bucket named `gemini-bucket` in your Cloudflare dashboard.
    - Upload a `knowledge.txt` file to this bucket containing your personal context and bio.

## Customization

- **Content**: All content is managed through Pages CMS. Edit content files in `frontend/content/` or use the CMS interface.
- **Styles**: The theme uses Tailwind CSS. You can modify the color palette and font settings in `frontend/index.css`.
- **AI Behavior**: The system prompt for the AI is located in `backend/data/prompt.md`.

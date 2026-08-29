# Deployment Guide

Complete guide for deploying the frontend (Cloudflare Pages) and backend (Cloudflare Workers) with automated CI/CD.

## Prerequisites

- Cloudflare account ([sign up](https://cloudflare.com))
- GitHub repository with code pushed to `main` branch
- Cloudflare API token with appropriate permissions
- **Node.js 20+** (required for Vite 7 and Wrangler 4 - GitHub Actions uses Node 24)

## Quick Start Checklist

- [ ] Cloudflare account created
- [ ] GitHub repository set up
- [ ] Code pushed to `main` branch

## Step-by-Step Deployment

### Step 1: Create Cloudflare API Token (5 min)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **"Edit Cloudflare Workers"** template
4. Add additional permissions:
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
5. Copy the token (you'll need it for GitHub Secrets)

### Step 2: Get Your Cloudflare Account ID (1 min)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Copy the **Account ID** from the right sidebar

### Step 3: Configure GitHub Secrets (5 min)

Go to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name             | Description                |
| ----------------------- | -------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Your Cloudflare API token  |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `SITE_URL`              | Your production site URL   |

**Note**: `CLOUDFLARE_WORKER_URL` will be added after Step 4.

### Step 4: First Backend Deployment (5 min)

**Deployment is push-based.** Pushing to `main` runs `.github/workflows/deploy.yml`,
which deploys both the frontend and the Worker. There is no manual deploy step —
you do not need `wrangler login` locally.

Push to `main` once to create the Worker, then read its URL from
**Cloudflare Dashboard** → **Workers & Pages** → `ivanovyordan-com-backend`
(e.g. `https://ivanovyordan-com-backend.<account>.workers.dev`).

### Step 5: Set Backend Secrets (5 min)

Backend secrets live in Cloudflare, not GitHub Secrets. The workflow deploys code;
secrets are managed separately and persist across deployments, so this is one-off.

Set them in **Cloudflare Dashboard** → **Workers & Pages** → `ivanovyordan-com-backend`
→ **Settings** → **Variables and Secrets**:

| Secret              | Value                        |
| ------------------- | ---------------------------- |
| `GEMINI_API_KEY`    | Google AI Studio API key     |
| `PINECONE_BASE_URL` | Pinecone index host URL      |
| `PINECONE_API_KEY`  | Pinecone API key             |

The non-secret model and profile settings are plain `[vars]` in
`backend/wrangler.toml` and deploy with the code.

### Step 6: Add Worker URL to GitHub Secrets (2 min)

Go back to GitHub Secrets and add:

- `CLOUDFLARE_WORKER_URL` = Your Worker URL from Step 4

### Step 7: Create Cloudflare Pages Project (5 min)

**Important**: Make sure you're creating a **Pages** project, not a **Workers Build**. They're different:

- **Pages**: For static sites, build command is optional, no deploy command needed
- **Workers Builds**: For Workers, requires a deploy command

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** (NOT Workers & Pages → Builds)
2. Click **Create a project**
3. Connect your GitHub repository
4. Configure build settings:
   - **Framework preset**: None (or Vite)
   - **Build command**: `npm ci && npm run build:frontend`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: Leave empty (or `/`)
   - **Deploy command**: Leave empty (Pages doesn't need this - if you see it, you might be in Workers Builds)
5. **Disable automatic deployments** (recommended):
   - Go to **Settings** → **Builds & deployments**
   - Disable "Automatic deployments" or "Deploy on git push"
   - This ensures GitHub Actions handles all deployments (prevents conflicts)
6. Add environment variables (optional - GitHub Actions will handle these):
   - `VITE_API_URL`: Your Worker URL (from Step 4)
   - `VITE_SITE_URL`: Your production site URL

**Important Notes**:

- **Deployment Strategy**: We use GitHub Actions to deploy both frontend and backend via `cloudflare/wrangler-action@v3`.
- If Pages has automatic deployments enabled, you'll get duplicate deployments. Disable Pages' automatic deployments.
- The backend (Workers) deployment happens separately via GitHub Actions, not through Pages.
- If you see a mandatory "Deploy command" field, you might be in Workers Builds instead of Pages. Create a Pages project instead.

### Step 8: Push to Main (1 min)

```bash
git push origin main
```

GitHub Actions will automatically:

- ✅ Build frontend with environment variables
- ✅ Deploy frontend to Cloudflare Pages
- ✅ Deploy backend to Cloudflare Workers

## DNS Configuration

Configure DNS records in your domain provider or Cloudflare Dashboard:

1. Go to **Cloudflare Dashboard** → **DNS** → **Records**
2. Add an A record:
   - **Type**: `A`
   - **Name**: `@` (or your subdomain)
   - **IPv4 address**: Get the IP from Cloudflare Pages settings
   - **Proxy status**: Proxied (orange cloud)
3. Add a CNAME record for www (if needed):
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: Your Cloudflare Pages domain
   - **Proxy status**: Proxied (orange cloud)

## How It Works

1. **Push to main branch** → GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers
2. **Frontend build** → Builds React app with `VITE_API_URL` and `VITE_SITE_URL` from GitHub Secrets
3. **Frontend deploy** → Deploys `frontend/dist` to Cloudflare Pages
4. **Backend deploy** → Deploys backend to Cloudflare Workers (secrets are already set in Cloudflare)

## D1 Database

The D1 database stores AI question analytics. It is already provisioned as
`ivanovyordan-com-database` and wired up in `backend/wrangler.toml` — the steps
below are only needed when recreating it from scratch.

The `DB` binding is optional in code: if it is missing, question logging is
skipped and the assistant still answers.

### Step 1: Create D1 Database

```bash
cd backend
npx wrangler d1 create ivanovyordan-com-database
```

Copy the `database_id` from the output.

### Step 2: Update wrangler.toml

```toml
[[d1_databases]]
binding = "DB"
database_name = "ivanovyordan-com-database"
database_id = "your-database-id-here"
```

### Step 3: Run Migration

```bash
npx wrangler d1 execute ivanovyordan-com-database --local --file=./migrations/0001_create_questions_table.sql
npx wrangler d1 execute ivanovyordan-com-database --remote --file=./migrations/0001_create_questions_table.sql
```

### Step 4: Verify

```bash
npx wrangler d1 execute ivanovyordan-com-database --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='questions';"
```

### Step 5: Deploy

Commit the updated `wrangler.toml` and push to `main` — the workflow deploys it.

### Database Schema

- `id` - Auto-incrementing primary key
- `query` - The user's question
- `created_at` - Timestamp
- `knowledge_found` - Whether knowledge was found (0 or 1)
- `article_url` - URL of referenced article (if any)
- `article_section` - Title of the referenced article chunk (if any)
- `response_text` - AI's response
- `client_ip` - Client IP address
- `country_code` - ISO country code (from Cloudflare headers)

### Querying Data

```bash
npx wrangler d1 execute ivanovyordan-com-database --command="SELECT * FROM questions ORDER BY created_at DESC LIMIT 10;"
npx wrangler d1 execute ivanovyordan-com-database --command="SELECT query, created_at FROM questions WHERE knowledge_found = 0 ORDER BY created_at DESC;"
npx wrangler d1 execute ivanovyordan-com-database --command="SELECT article_url, COUNT(*) as count FROM questions WHERE article_url IS NOT NULL GROUP BY article_url ORDER BY count DESC;"
```

Query via Cloudflare Dashboard: **Workers & Pages** → **D1** → Select database → **Open Console**.

## Troubleshooting

### Frontend deployment fails

- Check GitHub Actions logs in the **Actions** tab
- Verify `CLOUDFLARE_WORKER_URL` and `SITE_URL` are set in GitHub Secrets
- Ensure Cloudflare Pages project exists and is connected to your repo
- Verify the project name in `.github/workflows/deploy.yml` matches your Pages project
- **Node.js version error**: If you see "Wrangler requires at least Node.js v20.0.0", ensure the workflow uses Node 24 (already configured)

### Build succeeds but deployment fails with Node.js version error

**Error**: `Wrangler requires at least Node.js v20.0.0. You are using v18.20.8`

**Solution**: The workflow is already configured to use Node 24. If you still see this error:

1. Ensure you've pushed the latest workflow changes
2. `cloudflare/wrangler-action@v3` should resolve Wrangler 4 from the repo's lockfile
3. If the error persists, the action might be using its own Node version - check the action's documentation

### Pages trying to run `npx wrangler deploy`

**Error**: `Missing entry-point to Worker script` or `npx wrangler deploy` in Pages logs

**Cause**: You might have created a **Workers Build** instead of a **Pages** project, or Pages has a deploy command configured.

**Solution**:

1. **Check what you created**:

   - Go to Cloudflare Dashboard
   - If you see it under **Workers & Pages** → **Builds**, you created a Workers Build (wrong)
   - If you see it under **Pages**, you created a Pages project (correct)

2. **If you created a Workers Build by mistake**:

   - Delete it and create a new **Pages** project instead
   - Pages projects don't require deploy commands

3. **If it's a Pages project with a deploy command**:

   - Go to **Pages** → Your Project → **Settings** → **Builds & deployments**
   - **Disable automatic deployments** - This prevents Pages from trying to deploy
   - Remove or clear the **Deploy command** field (if it exists)
   - The actual deployment is handled by GitHub Actions via `cloudflare/wrangler-action@v3`

4. **Verify**: After fixing, GitHub Actions should handle all deployments. Check the Actions tab after pushing to main.

**Alternative**: If you prefer Pages to handle frontend deployments automatically:

- Keep Pages automatic deployments enabled
- Remove the `deploy-frontend` job from `.github/workflows/deploy.yml`
- Only use GitHub Actions for backend (Workers) deployment

### Backend deployment fails

- Verify secrets are set in the Cloudflare Dashboard → Worker → **Settings** → **Variables and Secrets**
- Check that `wrangler.toml` is correctly configured
- Ensure Worker name matches in `wrangler.toml`
- Check GitHub Actions logs for specific error messages

### Environment variables not working

- **Frontend**: Variables must start with `VITE_` to be exposed to the browser
- **Backend**: Secrets must be set in Cloudflare Workers dashboard (not GitHub Secrets)
- Verify environment variables are set in GitHub Secrets for the build process

### Worker URL not found

- Push to `main` once to create the Worker, then read its URL from the Cloudflare Dashboard
- Add that URL to GitHub Secrets as `CLOUDFLARE_WORKER_URL`

## Build Configuration Reference

If setting up Cloudflare Pages manually, use these settings:

- **Framework preset**: None (or Vite)
- **Build command**: `npm ci && npm run build:frontend`
- **Build output directory**: `frontend/dist`
- **Root directory**: Leave empty (or `/`)
- **Deploy command**: Leave empty (Pages deploys automatically - do not use `npx wrangler deploy`)

**Important**: The deploy command field should be empty. Cloudflare Pages automatically deploys the build output. If you set a deploy command (like `npx wrangler deploy`), it will try to deploy as a Worker, which will fail.

Environment variables (managed by GitHub Actions, but can be set as fallback):

- `VITE_API_URL`: Your Cloudflare Worker URL
- `VITE_SITE_URL`: Your production site URL

## How Deployments Work

- **Frontend (Pages)**: GitHub Actions builds and deploys to Cloudflare Pages automatically on push to `main`
- **Backend (Workers)**: GitHub Actions deploys to Cloudflare Workers automatically on push to `main`
- **Manual Pages Setup**: If you set up Pages manually (before GitHub Actions), Pages will auto-deploy on git push, but the GitHub Actions workflow will override this and handle deployments instead

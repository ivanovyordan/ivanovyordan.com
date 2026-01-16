# Deployment Guide

Complete guide for deploying the frontend (Cloudflare Pages) and backend (Cloudflare Workers) with automated CI/CD.

## Prerequisites

- Cloudflare account ([sign up](https://cloudflare.com))
- GitHub repository with code pushed to `main` branch
- Cloudflare API token with appropriate permissions

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

| Secret Name | Description | Example |
|------------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | From Step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | From Step 2 |
| `SITE_URL` | Your production site URL | `https://www.ivanovyordan.com` |

**Note**: `CLOUDFLARE_WORKER_URL` will be added after Step 4.

### Step 4: Initial Backend Deployment (10 min)

Before automated deployments work, deploy the backend once manually to get the Worker URL:

```bash
cd backend
npm install
npx wrangler login
npx wrangler deploy
```

After deployment, note the Worker URL (e.g., `https://ivanovyordan-digital-twin-backend.xxx.workers.dev`)

### Step 5: Set Backend Secrets (5 min)

Backend secrets must be set in Cloudflare Workers (not GitHub Secrets). The GitHub Actions workflow deploys code, but secrets are managed separately.

**Option 1: Using Wrangler CLI (Recommended)**

```bash
cd backend
npx wrangler secret put GEMINI_API_KEY
# Enter your Gemini API key when prompted
npx wrangler secret put PINECONE_BASE_URL
# Enter your Pinecone base URL when prompted
npx wrangler secret put PINECONE_API_KEY
# Enter your Pinecone API key when prompted
```

**Option 2: Using Cloudflare Dashboard**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Select your worker (`ivanovyordan-digital-twin-backend`)
3. Go to **Settings** → **Variables and Secrets**
4. Click **Add variable** for each secret:
   - `GEMINI_API_KEY` → Your Google Gemini API key
   - `PINECONE_BASE_URL` → Your Pinecone API base URL
   - `PINECONE_API_KEY` → Your Pinecone API key

**Note**: These secrets persist across deployments. You only need to set them once.

### Step 6: Add Worker URL to GitHub Secrets (2 min)

Go back to GitHub Secrets and add:
- `CLOUDFLARE_WORKER_URL` = Your Worker URL from Step 4

### Step 7: Create Cloudflare Pages Project (5 min)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **Create a project**
3. Connect your GitHub repository
4. Project name: `ivanovyordan-com`
5. Configure build settings:
   - **Framework preset**: None (or Vite)
   - **Build command**: `npm ci && npm run build:frontend`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/` (leave empty)
6. Add environment variables (optional - GitHub Actions will handle these):
   - `VITE_API_URL`: Your Worker URL (from Step 4)
   - `VITE_SITE_URL`: Your production site URL

**Note**: The GitHub Actions workflow will handle deployments automatically, but you need to create the Pages project first. Don't enable automatic deployments in Pages - let GitHub Actions handle it.

### Step 8: Push to Main (1 min)

```bash
git push origin main
```

GitHub Actions will automatically:
- ✅ Build frontend with environment variables
- ✅ Deploy frontend to Cloudflare Pages
- ✅ Deploy backend to Cloudflare Workers

## How It Works

1. **Push to main branch** → GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers
2. **Frontend build** → Builds React app with `VITE_API_URL` and `VITE_SITE_URL` from GitHub Secrets
3. **Frontend deploy** → Deploys `frontend/dist` to Cloudflare Pages
4. **Backend deploy** → Deploys backend to Cloudflare Workers (secrets are already set in Cloudflare)

## Optional: Set Up Rate Limiting KV Namespace

For production rate limiting across multiple Workers instances:

```bash
cd backend
npx wrangler kv:namespace create "RATE_LIMIT_KV"
```

Copy the `id` from the output and add it to `backend/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-namespace-id"
```

## Troubleshooting

### Frontend deployment fails
- Check GitHub Actions logs in the **Actions** tab
- Verify `CLOUDFLARE_WORKER_URL` and `SITE_URL` are set in GitHub Secrets
- Ensure Cloudflare Pages project exists and is connected to your repo
- Verify the project name in `.github/workflows/deploy.yml` matches your Pages project

### Backend deployment fails
- Verify secrets are set: `npx wrangler secret list` (from backend directory)
- Check that `wrangler.toml` is correctly configured
- Ensure Worker name matches in `wrangler.toml`
- Check GitHub Actions logs for specific error messages

### Environment variables not working
- **Frontend**: Variables must start with `VITE_` to be exposed to the browser
- **Backend**: Secrets must be set in Cloudflare Workers dashboard (not GitHub Secrets)
- Verify environment variables are set in GitHub Secrets for the build process

### Worker URL not found
- Deploy backend manually first (Step 4) to get the Worker URL
- Add the Worker URL to GitHub Secrets before pushing to main

## Manual Deployment (If Needed)

If you need to deploy manually without GitHub Actions:

### Frontend
```bash
npm run build:frontend
# Then upload frontend/dist to Cloudflare Pages manually via dashboard
```

### Backend
```bash
cd backend
npm run deploy
```

## Build Configuration Reference

If setting up Cloudflare Pages manually, use these settings:

- **Framework preset**: None (or Vite)
- **Build command**: `npm ci && npm run build:frontend`
- **Build output directory**: `frontend/dist`
- **Root directory**: `/` (leave empty)

Environment variables (managed by GitHub Actions, but can be set as fallback):
- `VITE_API_URL`: Your Cloudflare Worker URL
- `VITE_SITE_URL`: Your production site URL

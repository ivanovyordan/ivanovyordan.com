# Deployment Guide

Complete guide for deploying the frontend (Cloudflare Pages) and backend (Cloudflare Workers) with automated CI/CD.

## Prerequisites

- Cloudflare account ([sign up](https://cloudflare.com))
- GitHub repository with code pushed to `main` branch
- Cloudflare API token with appropriate permissions
- **Node.js 20+** (required for Vite 7 and Wrangler 4 - GitHub Actions uses Node 20)

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

| Secret Name             | Description                | Example                        |
| ----------------------- | -------------------------- | ------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | Your Cloudflare API token  | From Step 1                    |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | From Step 2                    |
| `SITE_URL`              | Your production site URL   | `https://www.ivanovyordan.com` |

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

**Important**: Make sure you're creating a **Pages** project, not a **Workers Build**. They're different:

- **Pages**: For static sites, build command is optional, no deploy command needed
- **Workers Builds**: For Workers, requires a deploy command

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** (NOT Workers & Pages → Builds)
2. Click **Create a project**
3. Connect your GitHub repository
4. Project name: `ivanovyordan-com`
5. Configure build settings:
   - **Framework preset**: None (or Vite)
   - **Build command**: `npm ci && npm run build:frontend`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: Leave empty (or `/`)
   - **Deploy command**: Leave empty (Pages doesn't need this - if you see it, you might be in Workers Builds)
6. **Disable automatic deployments** (recommended):
   - Go to **Settings** → **Builds & deployments**
   - Disable "Automatic deployments" or "Deploy on git push"
   - This ensures GitHub Actions handles all deployments (prevents conflicts)
7. Add environment variables (optional - GitHub Actions will handle these):
   - `VITE_API_URL`: Your Worker URL (from Step 4)
   - `VITE_SITE_URL`: Your production site URL

**Important Notes**:

- **Deployment Strategy**: We use GitHub Actions to deploy both frontend (via `cloudflare/pages-action`) and backend (via `cloudflare/wrangler-action`).
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
- **Node.js version error**: If you see "Wrangler requires at least Node.js v20.0.0", ensure the workflow uses Node 20 (already configured)

### Build succeeds but deployment fails with Node.js version error

**Error**: `Wrangler requires at least Node.js v20.0.0. You are using v18.20.8`

**Solution**: The workflow is already configured to use Node 20. If you still see this error:

1. Ensure you've pushed the latest workflow changes
2. The `cloudflare/pages-action` should use Wrangler 4 (configured with `wranglerVersion: 4`)
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
   - The actual deployment is handled by GitHub Actions via `cloudflare/pages-action`

4. **Verify**: After fixing, GitHub Actions should handle all deployments. Check the Actions tab after pushing to main.

**Alternative**: If you prefer Pages to handle frontend deployments automatically:

- Keep Pages automatic deployments enabled
- Remove the `deploy-frontend` job from `.github/workflows/deploy.yml`
- Only use GitHub Actions for backend (Workers) deployment

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

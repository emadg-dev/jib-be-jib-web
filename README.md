# Jib-be-Jib: Collaborative Trip Expense Manager

## Architecture Overview
- **Backend**: Cloudflare Workers, Hono, D1 (SQLite), TypeScript.
- **Frontend**: React 19, Vite, TanStack Query, Tailwind CSS, Recharts.

## Local Development

### 1. Database & Backend
1. `cd jib-be-jib-api`
2. `npm install`
3. Initialize local D1 SQLite DB: `npm run db:init`
4. Seed local data: `npm run db:seed`
5. Start backend: `npm run dev` (API will run at `http://localhost:8787`)
*(Note: Initial credentials from seed are `Emad` / `password123`)*

### 2. Frontend Web Client
1. Open a new terminal.
2. `cd jib-be-jib-web`
3. `npm install`
4. Start frontend: `npm run dev`
5. Navigate to `http://localhost:3000`

## Cloudflare Deployment

### Deploying the Database (D1)
1. Authenticate with Cloudflare: `npx wrangler login`
2. Create D1 Database: `npx wrangler d1 create jib-be-jib-db`
3. Copy the `database_id` outputted in the terminal and replace `REPLACE_WITH_YOUR_D1_ID` in `jib-be-jib-api/wrangler.jsonc`.
4. Run schema on production: `npm run db:init:prod` (Run from API folder).
5. (Optional) Run seed on production: `npm run db:seed:prod`.

### Deploying the Backend (Workers)
1. Inside `jib-be-jib-api`, run `npm run deploy`
2. Add the `JWT_SECRET` variable in Cloudflare dashboard under your Worker -> Settings -> Variables.
3. Note your worker URL (e.g., `https://jib-be-jib-api.<your-username>.workers.dev`).

### Deploying the Frontend (Pages)
1. Create a `.env.production` in `jib-be-jib-web` containing:
   `VITE_API_URL=https://jib-be-jib-api.<your-username>.workers.dev/api`
2. Run build: `npm run build`
3. Deploy to Cloudflare Pages: `npx wrangler pages deploy dist --project-name jib-be-jib-web`
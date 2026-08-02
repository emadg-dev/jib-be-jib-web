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

## Deployment

- This project can be hosted on any static hosting provider for the frontend and any HTTP server for the backend.
- In production set `VITE_API_URL` to your backend API base URL (e.g. `https://api.example.com/api`) in a `.env.production` file inside `jib-be-jib-web`.
- Build the frontend with `npm run build` and deploy the resulting `dist` directory to your chosen hosting provider.
- The backend (in `jib-be-jib-api`) can be deployed to any environment that supports the chosen runtime. Follow the backend README for deployment steps.
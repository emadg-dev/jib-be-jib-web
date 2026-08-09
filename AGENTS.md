# Jib-be-Jib Web

Collaborative trip expense tracker frontend. React 19 + Vite + TanStack Query + Tailwind CSS.

## Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 19 (SPA, client-side) |
| Build | Vite 7.3.6 |
| Routing | react-router-dom v6 |
| State | TanStack React Query v5 + React Context |
| HTTP | Axios (cookie-based auth) |
| Forms | react-hook-form + Zod |
| UI | Custom components (Radix UI primitives, Lucide icons) |
| Charts | Recharts |
| Dates | react-multi-date-picker (Jalali/Persian support) |
| Styling | Tailwind CSS 3.4 + CSS variables (shadcn/ui pattern) |
| PWA | vite-plugin-pwa |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on port 3000 (proxies /api to localhost:8787) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Architecture

```
src/
├── main.tsx                 # Entry point (createRoot, StrictMode)
├── App.tsx                  # Root: routing, providers, auth guards
├── index.css                # Tailwind directives, CSS variables, fonts
├── api/
│   ├── client.ts            # Axios instance (baseURL, interceptors, token injection)
│   └── services.ts          # All API functions + TypeScript interfaces
├── components/
│   ├── JalaliDatePicker.tsx  # Persian date picker wrapper
│   └── ui/
│       ├── core.tsx          # Card, Button, Input, Label, Select, Checkbox, Table*
│       └── alert-dialog.tsx  # Modal dialog (Radix UI, variant-aware)
├── contexts/
│   ├── AuthContext.tsx       # Auth + trip selection state
│   └── PreferencesContext.tsx # Language (en/fa) + theme (light/dark)
├── layouts/
│   └── AppLayout.tsx         # App shell (sidebar, header, nav, trip switcher)
├── pages/
│   ├── Login.tsx             # Login form
│   ├── Dashboard.tsx         # Stats cards, charts, settlements
│   ├── Members.tsx           # Member CRUD
│   ├── Deposits.tsx          # Deposit CRUD
│   ├── Withdrawals.tsx       # Expense CRUD with beneficiary splitting
│   ├── TripPicker.tsx        # Trip selection/creation/editing
│   └── Profile.tsx           # Profile + password change
├── types/index.ts            # All TypeScript interfaces
└── utils/
    ├── format.ts             # Number formatting, money parsing
    ├── jalaali.ts            # Gregorian ↔ Jalali calendar
    └── translations.ts       # English → Farsi error translations
```

## Routes

| Route | Component | Auth | Role |
|-------|-----------|------|------|
| `/login` | Login | No | - |
| `/trips` | TripPicker | Yes | - |
| `/dashboard` | Dashboard | Yes | - |
| `/members` | Members | Yes | Owner |
| `/deposits` | Deposits | Yes | - (writes gated in UI) |
| `/withdrawals` | Withdrawals | Yes | - (writes gated in UI) |
| `/profile` | Profile | Yes | - |

Route guards: `ProtectedRoute` (auth check) → `RoleRoute` (role check)

## State Management

- **AuthContext**: user, trips, selectedTrip, login/logout/selectTrip/createTrip/updateTrip/deleteTrip
- **PreferencesContext**: language (en/fa), theme (light/dark) — persists to localStorage
- **TanStack Query**: all server state (dashboard, members, deposits, withdrawals, profile)
- **Local state**: forms, editing modes, UI toggles

## API Integration

- Axios instance at `src/api/client.ts`
- Base URL: `VITE_API_URL` (default `/api`)
- Cookie-based auth with Bearer token fallback
- Interceptors: attach token, unwrap response.data, handle 409/403 via custom events
- Custom events: `trip-changed` (clears query cache), `trip-selection-required`, `owner-permission-required`

## API Endpoints (consumed)

| Group | Functions in `services.ts` |
|-------|---------------------------|
| auth | `authApi.login`, `.logout`, `.me` |
| trips | `tripsApi.available`, `.select`, `.create`, `.get`, `.update`, `.delete` |
| dashboard | `dashboardApi.get` |
| members | `membersApi.getAll`, `.create`, `.add`, `.update`, `.delete` |
| deposits | `depositsApi.getAll`, `.create`, `.update`, `.delete` |
| withdrawals | `withdrawalsApi.getAll`, `.create`, `.update`, `.delete` |
| profile | `profileApi.get`, `.changePassword` |

## Key Types (src/types/index.ts)

`User`, `Trip`, `Member`, `Deposit`, `Withdrawal`, `WithdrawalMember`, `Dashboard`, `Balance`

## UI Components (src/components/ui/core.tsx)

`Card` (+ Header/Title/Content), `Button` (primary/destructive/secondary/outline/ghost + loading), `Input`, `Label`, `Select`, `Checkbox`, `Table` (+ Thead/Tbody/Tr/Th/Td), `AlertDialog`

## Styling

- Tailwind CSS with CSS variable tokens (shadcn/ui pattern)
- Dark mode: class-based (`.dark` on `<html>`)
- RTL support: dynamic `dir="rtl"`, logical CSS properties (`ps-`, `pe-`)
- Fonts: Shabnam, Iranian Sans (Persian)
- Custom utility classes: `.glass-panel`, `.page-title`, `.page-subtitle`, `.form-label`, `.form-grid`

## Deployment

- Dev: Vite proxies `/api` → `http://localhost:8787`
- Production: Cloudflare Pages with `functions/api/[[path]].ts` catch-all proxy → `https://jib-be-jib-api.emadg-dev.workers.dev`

@../manga-meta/CLAUDE.md

## manga-frontend

Next.js 15 App Router frontend for Manga.

### Stack

- Next.js 15, React 19, TypeScript 5.7
- shadcn/ui (Radix + Tailwind), Lucide icons, Sonner toasts
- TanStack React Query 5 + Axios (10s timeout)
- react-hook-form + Zod (auth pages only)
- Playwright E2E tests

### Run locally

```bash
npm install
npm run dev   # port 3100
```

### Key paths

- `app/(app)/` — authenticated routes
- `app/(auth)/` — login, register, confirm-email
- `app/(portal)/` — public client portal (access token auth)
- `components/ui/` — shadcn primitives
- `lib/api/` — Axios clients (`client.ts` for authed, `portal.ts` for public)
- `lib/types/` — TypeScript interfaces
- `e2e/` — Playwright specs
- `middleware.ts` — Edge middleware (JWT decode, public path gating)

### Deployment

Vercel. Free tier subdomain: `manga.vercel.app`. Env vars configured via Vercel dashboard — use `.env.example` as reference.

### Conventions

- **Forms:** auth pages use `react-hook-form` + Zod. Everything else uses `useState` + `useMutation` (simpler; less boilerplate)
- **Tests:** Playwright uses visible text and labels — **do not** add `data-testid` attributes
- **Help UI:** `components/shared/help-button.tsx` is the shared `HelpButton` component. Integrated via `PageHeader`'s `help?: HelpContent` prop
- **`AlertDialog` is NOT installed** from shadcn — use `window.confirm()` for destructive action prompts

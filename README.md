# manga-frontend

Next.js 15 frontend for the Manga SaaS.

## Part of the Manga system

- [manga-ia-app/.github](https://github.com/manga-ia-app) — governance, specs
- [manga-api](https://github.com/manga-ia-app/manga-api) — .NET 8 backend
- **manga-frontend** (this repo) — Next.js 15 UI
- [manga-ai-service](https://github.com/manga-ia-app/manga-ai-service) — Python AI orchestration

## Local dev

```bash
npm install
cp .env.example .env.local
# Edit .env.local with local API/AI URLs
npm run dev
```

Opens on http://localhost:3100. Requires `manga-api` running on 5100 and (optionally) `manga-ai-service` on 5200.

## Tests

```bash
npm run test:e2e          # Playwright headless
npm run test:e2e:ui       # Playwright interactive
```

Backend must be running for E2E.

## Build

```bash
npm run build
npm start
```

## Deployment

Hosted on Vercel free tier. Connect the repo in Vercel dashboard; it auto-detects Next.js and deploys on push to `main`.

Env vars required in Vercel:
- `NEXT_PUBLIC_API_URL` — Koyeb API URL
- `NEXT_PUBLIC_AI_WS_URL` — Render AI WebSocket URL

See `.env.example` for full list.

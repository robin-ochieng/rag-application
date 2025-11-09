# Insurance Act Chatbot – Web UI

Modern chat UI built with Next.js App Router and Tailwind CSS. Proxies to the FastAPI backend for RAG answers.

## Run Locally

Backend (FastAPI):

```powershell
# from repo root
. .\.venv\Scripts\Activate.ps1
$env:DEMO_MODE="1"   # optional mock answers in dev
python -m uvicorn app_fastapi:app --host 127.0.0.1 --port 8000 --reload
```

Frontend (Next.js):

```powershell
cd web
# set backend base URL (defaults to http://127.0.0.1:8000 if missing)
"API_URL=http://127.0.0.1:8000" | Out-File -Encoding utf8 .env.local
npm install
npm run dev
```

Open http://localhost:3000/chat

## Environment Variables

- `API_URL` (server): Base URL for FastAPI (e.g., `http://127.0.0.1:8000`). The proxy and the API status badge both read this.
- `BACKEND_API_KEY` (optional): If FastAPI requires `X-API-KEY` header.

## API Contract

Request:

```json
POST /api/chat
{ "q": "What does the act say about ..." }
```

Response (FastAPI `/ask`):

```json
{
  "answer": "...",
  "citations": [
    { "id": "1", "label": "Benefit_Options.pdf#page=3", "href": "https://..." }
  ],
  "followUps": ["...", "..."]
}
```

If `citations` are absent, the UI attempts to synthesize links from `sources[].metadata`.

## Theming & Accessibility

- Light/dark modes with Tailwind; WCAG AA contrast.
- Keyboard shortcuts: Enter submit, Shift+Enter newline, Esc blur.
- Focus rings, ARIA labels on controls.

## Branding

Update colors/gradients in the primary button and tweak component classes under `src/components/chat/*`.

## Tests

From repo root:

```powershell
# API contract tests
pytest -q tests/api

# Web proxy tests (ensure Next dev is running)
cd web; npm run test:web

# E2E (Playwright) – ensure frontend is running
npx playwright install --with-deps
cd web; npm run test:e2e
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Insurance Act Chatbot UI (Full-page Layout)

Components:
- `src/components/NavBar.tsx`: sticky translucent navbar with logo/title and links
- `src/components/ChatLayout.tsx`: input (sticky on mobile), messages scroll area, citations per answer
- `src/components/Footer.tsx`: glass footer with "Developed by kenbright.ai" and minimal nav
- `src/components/ThemeSwitcher.tsx`: accessible dropdown for Light/Dark/System

Page wiring:
- `src/app/layout.tsx` composes the full-page gradient background + `<NavBar/>` `<main/>` `<Footer/>`
- `src/app/chat/page.tsx` loads `<ChatLayout/>`

Branding:
- Adjust the background gradient in `src/app/layout.tsx` body class (Tailwind `bg-gradient-to-br from[...] via[...] to[...]`).
- Tweak button gradients in `ChatLayout.tsx` (primary action uses violet→cyan).

Backend proxy (optional):
- `src/app/api/chat/route.ts` proxies to `process.env.BACKEND_URL` (`/chat`).
- Configure `.env.local` in `web/`:
	- `BACKEND_URL=http://localhost:8080`
	- `BACKEND_API_KEY=...` (if enabled on FastAPI)

## Theming

- Stack: `next-themes` + Tailwind class strategy.
- Provider: `src/app/providers.tsx` wraps the app with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange />`.
- No‑FOUC: `src/app/layout.tsx` injects a small inline script in `<head>` to apply the correct `dark` class from `localStorage.theme` or `prefers-color-scheme` before hydration. `<html suppressHydrationWarning>` is also set.
- CSS tokens: `src/app/globals.css` defines light defaults on `:root` and `.dark { ... }` overrides. Tailwind uses `dark:` variants.
- Switcher: `src/components/ThemeSwitcher.tsx` renders a compact button ("Light/Dark/System ▾") with an accessible menu containing a "System" label and two options: "Dark" and "Light". The selected option shows a ✓ and the choice persists.

Usage:
- Use Tailwind `dark:` variants (e.g., `bg-white dark:bg-neutral-900`).
- The switcher is wired in `src/components/NavBar.tsx`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

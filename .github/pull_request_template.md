## Title

Chat UI refactor: ChatGPT-style layout, fixed bottom composer, responsive actions, remove status pill

## Summary

This PR redesigns the Next.js chat UI to mirror a ChatGPT-like layout while preserving existing API/proxy behavior and theming. It maximizes chat space, moves the message composer to a fixed bottom bar (left Send icon, auto-growing textarea), removes the API status pill, relocates New/Clear controls to the header, and ensures only the chat list scrolls. Message action icons are responsive: a kebab menu appears on small screens; a compact toolbar shows on md+.

## Changes

- Layout: three-row grid (header, scrollable chat, bottom composer)
  - `web/src/components/ChatLayout.tsx`
    - Grid rows: `auto, 1fr, auto`; only middle region scrolls
    - Header actions: New chat, Clear chat (accessible buttons)
    - Bottom composer: spans width, fixed above footer
    - Removed old top composer + status pill
- Composer: new component
  - `web/src/components/chat/Composer.tsx`
    - Left Send icon, auto-grow textarea, Enter submit, Shift+Enter newline
    - Disabled while sending; one POST per send guard
- Message actions (Copy/Ideas/Pin)
  - `web/src/components/chat/Card.tsx`, `web/src/components/chat/Icons.tsx`
    - md+: top-right ghost icon toolbar (show-on-hover styling)
    - sm: single kebab opens small accessible menu
    - Content reserves space using `--bubble-actions-width` (no overlap)
- Navbar cleanup
  - `web/src/components/NavBar.tsx` — removed logo and About/Docs/Contact links, kept Theme switcher
- Theming
  - Next-themes class strategy preserved; no FOUC; CSS variables-based colors retained

## Screenshots

Before (attach):
- …

After (attach):
- Chat page with larger message area and bottom composer
- Actions toolbar (md+)
- Kebab menu (sm)
- Dark vs light theme

## Verification

Dev startup options:

```powershell
# From repo root
.\start dev server

# OR from /web
cd web
npm run dev:all
```

Open http://localhost:3001 and verify:
- Chat list is the only scrolling region; header and composer stay fixed
- Bottom composer: left Send icon, auto-growing textarea, Enter submit, Shift+Enter newline
- New/Clear buttons in header are accessible
- Actions never overlap text; kebab on mobile; toolbar on md+
- No duplicate sends; no hydration warnings; theming has no FOUC

## Accessibility
- Buttons have aria-labels; focus rings visible
- Kebab menu can be closed via Escape and outside click
- Tab order logical; pointer events don’t block text selection

## Checklist
- [x] UI only (no backend/proxy changes)
- [x] ESLint/TypeScript pass locally
- [x] Theming preserved (next-themes, CSS variables)
- [x] Tested mobile/desktop interaction

# Tests

This folder contains three suites:

- `api/` – FastAPI contract tests (pytest + requests)
- `web/` – Next proxy tests (Node + fetch)
- `e2e/` – Browser E2E (Playwright)

## Running tests

1) Backend (in another terminal):

```powershell
. .\.venv\Scripts\Activate.ps1
python -m uvicorn app_fastapi:app --host 127.0.0.1 --port 8000 --reload
```

2) Frontend (in another terminal):

```powershell
cd web
npm install
npm run dev
```

3) API tests:

```powershell
pytest -q tests/api
```

4) Web proxy tests:

```powershell
node tests/web/proxy.test.mjs
```

5) E2E tests:

```powershell
npx playwright install --with-deps
node tests/e2e/chat.e2e.mjs
```

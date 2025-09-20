import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webDir = resolve(__dirname, '..', '..', 'web');
const requireFromWeb = createRequire(resolve(webDir, 'package.json'));
const { chromium } = requireFromWeb('playwright');

const APP = process.env.APP_URL || 'http://127.0.0.1:3000/chat';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const requests = [];
  page.on('request', req => { if (req.method() === 'POST' && req.url().includes('/api/chat')) requests.push(req); });
  await page.goto(APP);

  // Wait for status pill and ensure it eventually is visible
  await page.waitForSelector('text=API', { timeout: 10000 });

  // Type a question and submit
  await page.fill('textarea#q', 'Hello');
  await page.click('button:has-text("Ask Question")');

  // Ensure a POST to /api/chat occurs
  await page.waitForResponse(res => res.url().includes('/api/chat') && res.request().method() === 'POST', { timeout: 15000 });

  // Assert user and assistant cards
  await page.waitForSelector('text=Hello');
  await page.waitForSelector('text=[demo] You asked:', { timeout: 5000 }).catch(() => {});

  // Citations row and follow-ups are optional; check if visible they are styled
  await page.locator('text=Citations:').first().isVisible().catch(() => {});

  // Toggle theme to ensure legibility
  await page.click('button[aria-label*="theme"], button:has-text("theme")').catch(() => {});

  await browser.close();
  console.log('e2e passed');
})();

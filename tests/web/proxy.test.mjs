import assert from 'node:assert/strict';

const PROXY = process.env.PROXY_URL || 'http://127.0.0.1:3000';

async function getJson(url, init) {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { res, data };
}

// Health proxy
{
  const { res, data } = await getJson(`${PROXY}/api/chat`);
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.ok(data.backend, 'backend should be included');
}

// Happy path
{
  const { res, data } = await getJson(`${PROXY}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q: 'Hello' }),
  });
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.ok('answer' in data);
}

// Negative mapping: backend missing field
{
  const { res } = await getJson(`${PROXY}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.ok([400, 422, 500].includes(res.status), 'expected status propagated');
}

console.log('web proxy tests passed');

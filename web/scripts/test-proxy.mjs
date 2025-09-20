const base = process.env.TEST_BASE || 'http://127.0.0.1:3001';

async function main() {
  const healthRes = await fetch(`${base}/api/health`).catch(e => ({ ok: false, status: 0, text: async () => String(e) }));
  const healthText = await healthRes.text();
  console.log('HEALTH STATUS', healthRes.ok, healthRes.status);
  console.log('HEALTH BODY', healthText);

  const chatRes = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Briefly say hello.' })
  }).catch(e => ({ ok: false, status: 0, text: async () => String(e) }));
  const chatText = await chatRes.text();
  console.log('CHAT STATUS', chatRes.ok, chatRes.status);
  console.log('CHAT BODY', chatText);
}

main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });

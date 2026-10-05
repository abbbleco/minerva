import assert from 'node:assert/strict';
import { test } from 'node:test';

// The Vercel entry must route exactly like the Node entry: same app, `hono/vercel` adapter.
// Stub mode keeps this hermetic (no DB, no upstream). STUB is read at module load, so the env
// is set before the first (dynamic) import; each test file runs in its own process.
async function vercelHandler(): Promise<(req: Request) => Promise<Response>> {
  process.env.MINERVA_ROUTER_STUB = '1';
  delete process.env.MINERVA_ROUTER_STUB_SCENARIO;
  const mod = (await import('../api/[[...route]].js')) as {
    default: (req: Request) => Promise<Response>;
  };
  assert.equal(typeof mod.default, 'function');
  return mod.default;
}

test('vercel entry serves /health in stub mode', async () => {
  const handle = await vercelHandler();
  const res = await handle(new Request('https://router.local/health'));
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status?: string; mode?: string };
  assert.equal(body.status, 'ok');
  assert.equal(body.mode, 'stub');
});

test('vercel entry routes chat completions in stub mode', async () => {
  const handle = await vercelHandler();
  const res = await handle(
    new Request('https://router.local/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    })
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as { id?: string; object?: string };
  assert.equal(body.id, 'chatcmpl-stub');
  assert.equal(body.object, 'chat.completion');
});

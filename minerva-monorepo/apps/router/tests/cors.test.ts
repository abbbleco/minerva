import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { app } from '../src/index.js';

const ALLOWED = 'https://portal.abbble.co.za';
const DENIED = 'https://evil.example.com';

afterEach(() => {
  delete process.env.MINERVA_CORS_ORIGINS;
});

function preflight(path: string, origin: string) {
  return app.request(path, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization, content-type',
    },
  });
}

test('preflight from the portal origin is allowed', async () => {
  const res = await preflight('/v1/chat/completions', ALLOWED);
  assert.equal(res.headers.get('access-control-allow-origin'), ALLOWED);
  const methods = res.headers.get('access-control-allow-methods') ?? '';
  assert.match(methods, /POST/);
});

test('preflight from an unknown origin gets no allow-origin header', async () => {
  const res = await preflight('/v1/chat/completions', DENIED);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('MINERVA_CORS_ORIGINS override is respected', async () => {
  process.env.MINERVA_CORS_ORIGINS = 'https://studio.abbble.co.za';
  const ok = await preflight('/v1/models', 'https://studio.abbble.co.za');
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://studio.abbble.co.za');
  const denied = await preflight('/v1/models', ALLOWED);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('local dev origins are allowed by default', async () => {
  const res = await preflight('/v1/models', 'http://localhost:3000');
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});

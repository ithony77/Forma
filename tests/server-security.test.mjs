import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.mjs';
import { createSpec } from '../shared/content.mjs';

async function setup(t, options = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'forma-security-'));
  const app = await createApp({ dataDir: directory, ...options });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const { token } = await (await fetch(`${base}/api/status`)).json();
  t.after(async () => { await app.close(); await rm(directory, { recursive: true, force: true }); });
  const call = (route, method = 'GET', data, headers = {}) => fetch(`${base}${route}`, { method, headers: { 'X-Forma-Token': token, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  return { app, base, token, call };
}

function providerFixture(_url, init) {
  const { questions } = JSON.parse(init.body);
  return new Response(JSON.stringify({ model: 'jev-fixture', usage: { input_tokens: 1, output_tokens: 1 }, answers: Object.fromEntries(Object.entries(questions).map(([key, question]) => [key, { type: 'choice', choice: Object.keys(question.criteria)[0], confidence: 1, probabilities: Object.fromEntries(Object.keys(question.criteria).map((option, index) => [option, index === 0 ? 1 : 0])) }])) }));
}

test('HTTP Origin requires the exact local URL including its scheme and hostname', async (t) => {
  const { call, base } = await setup(t);
  for (const origin of [base.replace('http://', ''), base.replace('127.0.0.1', 'localhost'), `${base}/`, 'null', base.replace('http:', 'https:')]) {
    assert.equal((await call('/api/status', 'GET', undefined, { Origin: origin })).status, 403);
  }
  assert.equal((await call('/api/status', 'GET', undefined, { Origin: base })).status, 200);
});

test('HTTP rejects unexpected envelope fields and coerced policy flags before mutation or provider calls', async (t) => {
  let providerCalls = 0;
  const { call } = await setup(t, { fetchImpl: (...args) => { providerCalls++; return providerFixture(...args); } });
  const spec = createSpec(), compose = { mode: 'demo', operation: 'create', prompt: 'Studio website', spec, locks: {} };
  const saved = await (await call('/api/projects', 'POST', { spec })).json();
  for (const [route, method, data] of [
    ['/api/connection', 'POST', { apiKey: 'fixture-key', extra: true }],
    ['/api/connection', 'DELETE', { extra: true }],
    ['/api/shutdown', 'POST', { extra: true }],
    ['/api/compose', 'POST', { ...compose, messages: [{ role: 'system', content: 'ignored instruction' }] }],
    ['/api/compose', 'POST', { ...compose, locks: { unknown: true } }],
    ['/api/compose', 'POST', { ...compose, locks: { palette: 'false' } }],
    ['/api/render', 'POST', { spec, channel: 'fixture_channel', extra: true }],
    ['/api/export', 'POST', { spec, extra: true }],
    ['/api/projects', 'POST', { spec, extra: true }],
    [`/api/projects/${saved.id}`, 'PUT', { spec, expectedRevision: 1, extra: true }],
    [`/api/projects/${saved.id}`, 'PUT', { spec, expectedRevision: 1, checkpoint: 'true' }],
    [`/api/projects/${saved.id}`, 'DELETE', { expectedRevision: 1, extra: true }],
    [`/api/projects/${saved.id}`, 'DELETE', { expectedRevision: '1' }]
  ]) assert.equal((await call(route, method, data)).status, 400, `${method} ${route}`);
  assert.equal(providerCalls, 0);
  assert.equal((await (await call(`/api/projects/${saved.id}`)).json()).revision, 1);
});

test('HTTP JSON media type and endpoint-specific raw byte limits are enforced', async (t) => {
  const { call } = await setup(t);
  assert.equal((await call('/api/connection', 'POST', {}, { 'Content-Type': 'application/json-invalid' })).status, 415);
  assert.equal((await call('/api/connection', 'POST', { apiKey: 'x'.repeat(5000) })).status, 413);
  assert.equal((await call('/api/projects', 'POST', { padding: 'x'.repeat(4400000) })).status, 413);
});

test('HTTP oversized chunked bodies receive 413 instead of losing the connection without a response', async (t) => {
  const { base, token } = await setup(t);
  const status = await new Promise((resolve, reject) => {
    const request = httpRequest(`${base}/api/connection`, { method: 'POST', headers: { 'X-Forma-Token': token, 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, (response) => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject);
    request.write('{"apiKey":"'); request.write('x'.repeat(5000)); request.end('"}');
  });
  assert.equal(status, 413);
});

test('HTTP disconnect aborts a pending connection and prevents credentials from being restored', { timeout: 5000 }, async (t) => {
  let entered, release, providerSignal;
  const started = new Promise((resolve) => { entered = resolve; });
  const released = new Promise((resolve) => { release = resolve; });
  const { call } = await setup(t, { fetchImpl: async (...args) => { providerSignal = args[1].signal; entered(); await released; return providerFixture(...args); } });
  const pending = call('/api/connection', 'POST', { apiKey: 'fixture-key' });
  await started;
  try {
    assert.equal((await call('/api/connection', 'POST', { apiKey: 'fixture-other-key' })).status, 409);
    assert.equal((await call('/api/connection', 'DELETE')).status, 200);
    assert.equal(providerSignal.aborted, true);
  } finally { release(); }
  assert.equal((await pending).status, 504);
  const status = await (await call('/api/status')).json();
  assert.equal(status.configured, false);
  assert.equal(status.verified, false);
});

test('HTTP client cancellation propagates to an in-flight connection test', { timeout: 5000 }, async (t) => {
  let entered, observeAbort;
  const started = new Promise((resolve) => { entered = resolve; });
  const aborted = new Promise((resolve) => { observeAbort = resolve; });
  const { base, token, call } = await setup(t, { fetchImpl: async (_url, init) => { entered(); return new Promise((_resolve, reject) => { init.signal.addEventListener('abort', () => { observeAbort(); reject(init.signal.reason); }, { once: true }); }); } });
  const controller = new AbortController();
  const pending = fetch(`${base}/api/connection`, { method: 'POST', headers: { 'X-Forma-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: 'fixture-key' }), signal: controller.signal });
  await started;
  controller.abort();
  await assert.rejects(pending);
  await aborted;
  assert.equal((await (await call('/api/status')).json()).configured, false);
});

test('HTTP local session burst budget covers reads as well as expensive actions', async (t) => {
  const { call } = await setup(t);
  for (let index = 0; index < 239; index++) assert.equal((await call('/api/status')).status, 200);
  const limited = await call('/api/projects');
  assert.equal(limited.status, 429);
  assert.match((await limited.json()).error, /request limit/);
});

test('HTTP caps concurrent request bodies and releases capacity after responses finish', { timeout: 5000 }, async (t) => {
  const { base, token, call } = await setup(t), requests = [], responses = [];
  t.after(() => { for (const request of requests) request.destroy(); });
  for (let index = 0; index < 12; index++) {
    let started, failed;
    const receiving = new Promise((resolve, reject) => { started = resolve; failed = reject; });
    responses.push(new Promise((resolve, reject) => {
      const request = httpRequest(`${base}/api/connection`, { method: 'POST', headers: { 'X-Forma-Token': token, 'Content-Type': 'application/json', 'Content-Length': '2', Expect: '100-continue' } }, (response) => { response.resume(); response.on('end', () => resolve(response.statusCode)); });
      request.on('continue', started);
      request.on('error', (error) => { failed(error); reject(error); });
      requests.push(request); request.flushHeaders();
    }));
    await receiving;
  }
  assert.equal((await call('/api/status')).status, 429);
  for (const request of requests) request.end('{}');
  assert.deepEqual(await Promise.all(responses), Array(12).fill(428));
  assert.equal((await call('/api/status')).status, 200);
});

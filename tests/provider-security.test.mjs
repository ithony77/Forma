import test from 'node:test';
import assert from 'node:assert/strict';
import { createJevEvaluator, validateResponse } from '../server/jev.mjs';

const questions = { theme: { type: 'choice', criteria: { light: 'Light', dark: 'Dark' } } };
const validResponse = { model: 'jev-fixture', usage: { input_tokens: 1, output_tokens: 1 }, answers: { theme: { type: 'choice', choice: 'light', confidence: 1, probabilities: { light: 1, dark: 0 } } } };
const evaluateResponse = (response, signal) => createJevEvaluator({ apiKey: 'fixture-key', fetchImpl: async () => response })({ state: 'fixture', questions, signal });

test('provider stream is cancelled at the byte limit before the complete body is buffered', async () => {
  let pulls = 0, cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { pulls++; controller.enqueue(new Uint8Array(250000).fill(32)); },
    cancel() { cancelled = true; }
  });
  await assert.rejects(evaluateResponse(new Response(stream)), /unreadable JSON/);
  assert.equal(cancelled, true);
  assert.ok(pulls <= 8, `Unexpected stream reads: ${pulls}`);
});

test('provider advertised oversized responses and unsuccessful bodies are discarded', async () => {
  for (const init of [{ headers: { 'Content-Length': '1500001' } }, { status: 401 }]) {
    let cancelled = false;
    const stream = new ReadableStream({ cancel() { cancelled = true; } });
    await assert.rejects(evaluateResponse(new Response(stream, init)));
    assert.equal(cancelled, true);
  }
});

test('provider byte limit counts UTF-8 bytes rather than JavaScript characters', async () => {
  const raw = JSON.stringify({ ...validResponse, padding: 'é'.repeat(760000) });
  assert.ok(raw.length < 1500000);
  assert.ok(Buffer.byteLength(raw) > 1500000);
  await assert.rejects(evaluateResponse(new Response(raw)), /unreadable JSON/);
});

test('provider cancellation stops a response that stalls after its headers', { timeout: 5000 }, async () => {
  let reading, cancelled = false;
  const started = new Promise((resolve) => { reading = resolve; });
  const controller = new AbortController();
  const stream = new ReadableStream({ pull() { reading(); }, cancel() { cancelled = true; } });
  const pending = evaluateResponse(new Response(stream), controller.signal);
  await started;
  controller.abort();
  await assert.rejects(pending, (error) => error.status === 504 && /cancelled/.test(error.message));
  assert.equal(cancelled, true);
});

test('provider rejects unsolicited answers and model fields containing arbitrary diagnostics', () => {
  const extra = structuredClone(validResponse);
  extra.answers.unsolicited = structuredClone(extra.answers.theme);
  assert.throws(() => validateResponse(extra, questions), /answer set/);
  const diagnostics = { ...validResponse, model: 'private response diagnostic' };
  assert.throws(() => validateResponse(diagnostics, questions), (error) => !error.message.includes(diagnostics.model));
});

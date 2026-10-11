import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createApp } from '../server/app.mjs';
import { collectReleaseFiles } from '../scripts/release-check.mjs';

test('public runtime ignores client network identities and exposes only local entrypoints', async t => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'forma-public-http-'));
  const app = await createApp({ dataDir, fetchImpl: () => { throw Error('Unexpected provider request.'); } });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await app.close(); await rm(dataDir, { recursive: true, force: true }); });
  const base = 'http://127.0.0.1:' + app.server.address().port;
  for (const headers of [{}, { 'x-forwarded-for': 'malformed', 'cf-connecting-ip': 'malformed' }, { 'x-forwarded-for': '192.0.2.1', 'cf-connecting-ip': '192.0.2.1' }]) {
    const response = await fetch(base + '/api/status', { headers }); assert.equal(response.status, 200);
    const status = await response.json(); assert.equal(status.version, '0.2.0'); assert.equal(status.catalogSize, 105); assert.ok(!('freeAllowance' in status));
  }
  const { token } = await (await fetch(base + '/api/status')).json();
  for (const entry of ['/turnstile.mjs', '/hosted-client.mjs', '/deployment.mjs', '/api/challenge']) assert.equal((await fetch(base + entry, { headers: { 'X-Forma-Token': token } })).status, 404);
  assert.equal((await fetch(base + '/api/projects')).status, 403);
  assert.equal((await fetch(base + '/', { headers: { Origin: 'https://evil.example' } })).status, 403);
});
test('the completed source selection is dependency-free and has no privacy or completeness findings', async () => {
  const result = await collectReleaseFiles(fileURLToPath(new URL('../', import.meta.url)));
  assert.deepEqual(result.problems, []);
  assert.ok(result.files.size > 130);
  for (const [file, content] of result.files) if (/^(?:public|server|shared)\//.test(file)) assert.ok(!/hostedClient|freeAllowance|turnstile|x-forwarded-for|cf-connecting-ip|ipHash/i.test(content.toString()), file);
});
test('real browser verifies local startup, explicit key testing, key restoration and offline export', { skip: !process.env.FORMA_PLAYWRIGHT_MODULE, timeout: 120000 }, async t => {
  const { chromium } = await import(pathToFileURL(process.env.FORMA_PLAYWRIGHT_MODULE));
  const dataDir = await mkdtemp(path.join(tmpdir(), 'forma-public-browser-')); let calls = 0;
  const app = await createApp({ dataDir, fetchImpl: async (_url, init) => {
    calls++; const input = JSON.parse(init.body);
    return new Response(JSON.stringify({ model: 'jev-public-fixture', usage: { input_tokens: 1, output_tokens: 1 }, answers: Object.fromEntries(Object.entries(input.questions).map(([id, question]) => { const selected = Object.keys(question.criteria)[0]; return [id, { type: 'choice', choice: selected, confidence: 1, probabilities: Object.fromEntries(Object.keys(question.criteria).map(option => [option, option === selected ? 1 : 0])) }]; })) }));
  } });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, ...(process.env.FORMA_TEST_BROWSER ? { executablePath: process.env.FORMA_TEST_BROWSER } : {}) });
  t.after(async () => { await browser.close(); await app.close(); await rm(dataDir, { recursive: true, force: true }); });
  const base = 'http://127.0.0.1:' + app.server.address().port, page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await page.addInitScript(() => { if (window === window.top) localStorage.setItem('forma:locale', 'en'); });
  const external = [], errors = [];
  page.on('request', request => { const url = request.url(); if (!url.startsWith(base + '/') && !/^(?:about:|blob:|data:|file:)/.test(url)) external.push(url); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base); await page.frameLocator('#preview-frame').locator('.site-section').first().waitFor();
  assert.equal(calls, 0); assert.equal(await page.locator('#human-dialog').count(), 0);
  if (await page.locator('#cookie-accept-button').isVisible()) await page.locator('#cookie-accept-button').click();
  await page.locator('#settings-button').click(); await page.locator('#api-key').fill('public-synthetic-test-key'); await page.locator('#connection-form').evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => document.querySelector('#settings-button').classList.contains('verified')).catch(async error => { throw new Error('Synthetic connection verification failed: ' + await page.locator('#connection-feedback').textContent(), { cause: error }); });
  assert.equal(calls, 1); assert.equal(await page.evaluate(() => localStorage.getItem('forma:api-key')), 'public-synthetic-test-key');
  await page.reload(); await page.frameLocator('#preview-frame').locator('.site-section').first().waitFor(); assert.equal(calls, 1, 'Reload restores without a provider probe');
  await page.locator('#provider-mode').selectOption('demo'); await page.locator('#prompt').fill('Create a software product website with pricing and FAQ.'); await page.locator('#build-form').evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => localStorage.getItem('forma:last-project') && !document.querySelector('#build-button').disabled);
  assert.equal(calls, 1); const saved = await app.store.list(); assert.equal(saved.projects.length, 1);
  const project = await app.store.get(saved.projects[0].id); assert.ok(!JSON.stringify(project).includes('public-synthetic-test-key'));
  const { token } = await (await fetch(base + '/api/status')).json();
  const response = await fetch(base + '/api/export', { method: 'POST', headers: { 'X-Forma-Token': token, 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ spec: project.spec }) });
  assert.equal(response.status, 200); const archive = Buffer.from(await response.arrayBuffer()); assert.equal(archive.readUInt32LE(0), 0x04034b50); assert.ok(!archive.includes(Buffer.from('public-synthetic-test-key'))); assert.ok(!archive.includes(Buffer.from('GPTchatly@gmail.com')));
  await page.locator('#settings-button').click(); await page.locator('#disconnect-button').click(); assert.equal(await page.evaluate(() => localStorage.getItem('forma:api-key')), null);
  assert.equal(calls, 1); assert.deepEqual(external, []); assert.deepEqual(errors, []);
});
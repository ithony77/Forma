import { PNG_IMAGE } from './fixtures/images.mjs';
/** Multipage contracts use local demo rules or synthetic fixtures, never live JEV. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.mjs';
import { compose } from '../server/composer.mjs';
import { demoEvaluate } from '../server/demo.mjs';
import { createSpec } from '../shared/content.mjs';
import { createPage, getPageSpec } from '../shared/pages.mjs';
import { validateSpec } from '../shared/schema.mjs';

function linkedSite() {
  const site = createSpec('Shared brand');
  site.pages = [createPage(site, { id: 'journal', title: 'Journal', slug: 'journal', template: 'blog' }), createPage(site, { id: 'first-article', title: 'First article', slug: 'first-article', template: 'article', showInNav: false })];
  site.sections.find((section) => section.group === 'hero').title = 'Home content never sent with journal';
  site.pages[1].sections.find((section) => section.group === 'hero').title = 'Sibling article content never sent';
  site.pages[0].sections.find((section) => section.group === 'gallery').items[0].href = 'page:first-article#about';
  site.pages[1].sections.find((section) => section.group === 'about').href = 'page:journal';
  site.pages[1].theme.palette = 'sage';
  return validateSpec(site);
}

async function setup(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'forma-pages-test-'));
  const app = await createApp({ dataDir: directory });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const { token } = await (await fetch(`${base}/api/status`)).json();
  t.after(async () => { await app.close(); await rm(directory, { recursive: true, force: true }); });
  const call = (pathname, method = 'GET', data) => fetch(`${base}${pathname}`, { method, headers: { 'X-Forma-Token': token, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  return { app, call };
}

function zipFiles(buffer) {
  const files = new Map();
  for (let offset = 0; buffer.readUInt32LE(offset) === 0x04034b50;) {
    assert.equal(buffer.readUInt16LE(offset + 8), 0, 'export entries are stored without compression');
    const length = buffer.readUInt32LE(offset + 18), nameLength = buffer.readUInt16LE(offset + 26), extraLength = buffer.readUInt16LE(offset + 28);
    const dataStart = offset + 30 + nameLength + extraLength;
    files.set(buffer.subarray(offset + 30, offset + 30 + nameLength).toString('utf8'), buffer.subarray(dataStart, dataStart + length).toString('utf8'));
    offset = dataStart + length;
  }
  return files;
}

test('demo composition changes only the selected page and preserves whole-site link records', async () => {
  const spec = linkedSite(), before = structuredClone(spec);
  const output = await compose({ mode: 'demo', operation: 'edit', prompt: 'Make it dark.', pageId: 'journal', spec, locks: {} }, demoEvaluate);
  assert.equal(output.spec.pages[0].theme.palette, 'midnight');
  assert.deepEqual(getPageSpec(output.spec, 'home'), getPageSpec(before, 'home'));
  assert.deepEqual(output.spec.pages[1], before.pages[1]);
  assert.deepEqual(output.spec.pages[0].sections, before.pages[0].sections);
  assert.equal(output.report.pageId, 'journal');
  assert.equal(output.report.calls, 0);
  assert.deepEqual(spec, before, 'composition cannot mutate its input');
});

test('a shared brand literal never renames an independent page', async () => {
  const spec = linkedSite(), brand = 'A'.repeat(90);
  const output = await compose({ mode: 'demo', operation: 'edit', prompt: `Brand: "${brand}"`, pageId: 'journal', spec, locks: {} }, demoEvaluate);
  assert.equal(output.spec.brand.name, brand);
  assert.equal(output.spec.pages[0].title, 'Journal');
  assert.equal(output.spec.name, spec.name);
});

test('fixture composition sends selected-page metadata but never sibling content or image bytes', async () => {
  const spec = linkedSite();
  spec.pages[0].sections.find((section) => section.group === 'hero').image = PNG_IMAGE;
  const seen = [];
  const evaluate = async (input) => {
    seen.push(JSON.stringify(input.state));
    const output = await demoEvaluate(input);
    return { ...output, model: 'fixture-not-live', usage: { input_tokens: 10, output_tokens: 5 } };
  };
  const output = await compose({ mode: 'jev', operation: 'redesign', prompt: 'An editorial journal with wide content.', pageId: 'journal', spec, locks: {} }, evaluate);
  assert.equal(output.report.calls, 2);
  assert.ok(seen.length === 2 && seen.every((state) => state.includes('Journal') && !state.includes('Home content never sent') && !state.includes('Sibling article content') && !state.includes('base64')));
  assert.deepEqual(output.spec.pages[1], spec.pages[1]);
  assert.equal(output.spec.pages[0].sections.find((section) => section.group === 'gallery').items[0].href, 'page:first-article#about');
});

test('home composition retains sibling pages, and unknown page requests never reach the evaluator', async () => {
  const spec = linkedSite();
  const output = await compose({ mode: 'demo', operation: 'edit', prompt: 'Make it dark.', spec, locks: {} }, demoEvaluate);
  assert.equal(output.report.pageId, 'home');
  assert.deepEqual(output.spec.pages, spec.pages);
  let called = false;
  await assert.rejects(compose({ mode: 'demo', operation: 'edit', prompt: 'Make it dark.', pageId: 'missing', spec, locks: {} }, async () => { called = true; }), /Page not found/);
  assert.equal(called, false);
});

test('removing a referenced section repairs incoming links without mutating the request', async () => {
  const spec = linkedSite(), before = structuredClone(spec);
  const output = await compose({ mode: 'demo', operation: 'edit', prompt: 'Remove the about section.', pageId: 'first-article', spec, locks: {} }, demoEvaluate);
  assert.ok(!output.spec.pages[1].sections.some((section) => section.group === 'about'));
  assert.equal(output.spec.pages[0].sections.find((section) => section.group === 'gallery').items[0].href, 'page:first-article');
  assert.deepEqual(getPageSpec(output.spec, 'home'), getPageSpec(before, 'home'));
  assert.deepEqual(validateSpec(output.spec), output.spec);
  assert.deepEqual(spec, before);
});

test('HTTP preview renders the requested page and rejects nonexistent or malformed page selectors', async (t) => {
  const { call } = await setup(t), spec = linkedSite();
  assert.equal((await call('/shared/pages.mjs')).status, 200);
  const response = await call('/api/render', 'POST', { spec, pageId: 'journal', channel: 'page_channel_1234' });
  assert.equal(response.status, 200);
  const output = await response.json();
  assert.match(output.html, /Latest articles/);
  assert.match(output.html, /data-channel="page_channel_1234"/);
  assert.ok(!output.source.includes('Home content never sent'));
  assert.ok(!output.source.includes('Sibling article content never sent'));
  for (const pageId of ['missing', '../journal', { id: 'journal' }]) {
    assert.equal((await call('/api/render', 'POST', { spec, pageId, channel: 'page_channel_1234' })).status, 400);
    assert.equal((await call('/api/compose', 'POST', { mode: 'demo', operation: 'edit', prompt: 'Make it dark.', spec, pageId, locks: {} })).status, 400);
  }
});

test('HTTP export contains linked independent HTML pages and the complete reimportable site', async (t) => {
  const { call } = await setup(t), spec = linkedSite();
  const response = await call('/api/export', 'POST', { spec });
  assert.equal(response.status, 200);
  const files = zipFiles(Buffer.from(await response.arrayBuffer()));
  assert.ok(['index.html', 'journal.html', 'first-article.html', 'project.json', 'source/site.css', 'source/pages/journal.css', 'source/pages/first-article.css', 'licenses/HYPERUI.txt'].every((filename) => files.has(filename)));
  assert.match(files.get('index.html'), /href="journal.html"/);
  assert.match(files.get('journal.html'), /href="first-article.html#about"/);
  assert.match(files.get('first-article.html'), /palette-sage/);
  assert.match(files.get('first-article.html'), /href="index.html"/);
  assert.ok(!/<button[^>]*data-add-section/.test(files.get('journal.html')));
  assert.notEqual(files.get('source/site.css'), files.get('source/pages/first-article.css'));
  assert.deepEqual(validateSpec(JSON.parse(files.get('project.json'))), spec);
  assert.match(files.get('README.txt'), /all 3 HTML pages together/);
});

test('HTTP project roundtrip and revision-checked checkpoints retain every independent page', async (t) => {
  const { call } = await setup(t), spec = linkedSite();
  const created = await (await call('/api/projects', 'POST', { spec })).json();
  assert.equal(created.pageCount, 3);
  assert.equal(created.sectionCount, spec.sections.length + spec.pages.reduce((count, page) => count + page.sections.length, 0));
  const next = structuredClone(spec);
  next.pages[1].sections.find((section) => section.group === 'about').body = 'Reviewed article body.';
  const saved = await (await call(`/api/projects/${created.id}`, 'PUT', { spec: next, expectedRevision: 1, checkpoint: true, label: 'Before article edit' })).json();
  assert.equal(saved.revision, 2);
  assert.deepEqual((await (await call(`/api/projects/${created.id}`)).json()).spec, next);
  const snapshot = await (await call(`/api/projects/${created.id}/history/${saved.history[0].id}`)).json();
  assert.deepEqual(snapshot.spec, spec);
  assert.equal((await call(`/api/projects/${created.id}`, 'PUT', { spec, expectedRevision: 1 })).status, 409);
  assert.deepEqual((await (await call(`/api/projects/${created.id}`)).json()).spec, next);
});

test('HTTP rejects unsafe page filenames and broken links before saving or exporting', async (t) => {
  const { call } = await setup(t);
  for (const mutate of [
    (spec) => { spec.pages[0].slug = '../escape'; },
    (spec) => { spec.pages[0].slug = 'index'; },
    (spec) => { spec.pages[1].slug = spec.pages[0].slug; },
    (spec) => { spec.pages[0].sections[1].href = 'page:missing'; }
  ]) {
    const spec = linkedSite(); mutate(spec);
    assert.equal((await call('/api/projects', 'POST', { spec })).status, 400);
    assert.equal((await call('/api/export', 'POST', { spec })).status, 400);
  }
  assert.deepEqual((await (await call('/api/projects')).json()).projects, []);
});

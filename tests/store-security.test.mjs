import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, truncate, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createSpec } from '../shared/content.mjs';
import { ProjectStore, StoreError } from '../server/store.mjs';

async function setup(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'forma-store-security-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = new ProjectStore(directory);
  await store.init();
  return { directory, store };
}

test('simultaneous creates cannot exceed the 100-project workspace quota', async (t) => {
  const { directory, store } = await setup(t);
  const spec = createSpec();
  await Promise.all(Array.from({ length: 99 }, (_, index) => {
    const id = `existing_${index}`;
    return writeFile(store.filename(id), JSON.stringify({ id, revision: 1, updatedAt: new Date().toISOString(), spec, history: [] }));
  }));
  const results = await Promise.allSettled(Array.from({ length: 4 }, () => store.create(spec)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected' && result.reason.status === 409).length, 3);
  assert.equal((await readdir(directory)).length, 100);
  const created = results.find((result) => result.status === 'fulfilled').value;
  await store.delete(created.id, created.revision);
  assert.equal((await store.create(spec)).revision, 1, 'a rejected create must not poison the queue');
});

test('unreadable saved projects still count toward the workspace quota', async (t) => {
  const { directory, store } = await setup(t);
  await Promise.all(Array.from({ length: 100 }, (_, index) => writeFile(store.filename(`broken_${index}`), '{')));
  await assert.rejects(store.create(createSpec()), (error) => error instanceof StoreError && error.status === 409);
  assert.equal((await readdir(directory)).length, 100);
  assert.deepEqual(await store.list(), { projects: [], skipped: 100 });
});

test('disk reads discard unrecognized metadata and normalize older valid snapshots', async (t) => {
  const { store } = await setup(t);
  const created = await store.create(createSpec());
  const saved = JSON.parse(await readFile(store.filename(created.id), 'utf8'));
  delete saved.spec.pages;
  delete saved.spec.sections[0].removedParts;
  saved.unrecognized = 'private disk-only metadata';
  saved.history = [{ id: 'legacy_checkpoint', label: 'Before edit', createdAt: saved.updatedAt, spec: saved.spec, unrecognized: 'private snapshot metadata' }];
  await writeFile(store.filename(created.id), JSON.stringify(saved));
  const reopened = await store.read(created.id);
  assert.deepEqual(Object.keys(reopened).sort(), ['history', 'id', 'revision', 'spec', 'updatedAt']);
  assert.deepEqual(Object.keys(reopened.history[0]).sort(), ['createdAt', 'id', 'label', 'spec']);
  assert.deepEqual(reopened.spec.pages, []);
  assert.deepEqual(reopened.spec.sections[0].removedParts, []);
  const checkpoint = await store.history(created.id, 'legacy_checkpoint');
  assert.deepEqual(checkpoint.spec, reopened.spec);
  assert.equal(JSON.stringify(checkpoint).includes('private'), false);
});

test('tampered saved metadata and checkpoint specs are rejected without changing disk', async (t) => {
  const mutations = {
    'invalid revision': (saved) => { saved.revision = '1'; },
    'invalid timestamp': (saved) => { saved.updatedAt = { unexpected: 'metadata' }; },
    'invalid date': (saved) => { saved.updatedAt = '2026-02-31T00:00:00.000Z'; },
    'invalid checkpoint label': (saved) => { saved.history[0].label = { unexpected: 'metadata' }; },
    'oversized checkpoint label': (saved) => { saved.history[0].label = 'x'.repeat(181); },
    'invalid checkpoint timestamp': (saved) => { saved.history[0].createdAt = 'invalid'; },
    'invalid checkpoint identifier': (saved) => { saved.history[0].id = '../secret'; },
    'duplicate checkpoint identifier': (saved) => { saved.history.push(saved.history[0]); },
    'invalid checkpoint spec': (saved) => { saved.history[0].spec.brand.href = 'javascript:alert(1)'; },
    'too many checkpoints': (saved) => { saved.history = Array.from({ length: 11 }, (_, index) => ({ ...saved.history[0], id: `checkpoint_${index}` })); },
  };
  for (const [name, mutate] of Object.entries(mutations)) await t.test(name, async (subtest) => {
    const { store } = await setup(subtest);
    const created = await store.create(createSpec());
    await store.update(created.id, { spec: created.spec, expectedRevision: 1, checkpoint: true });
    const filename = store.filename(created.id);
    const saved = JSON.parse(await readFile(filename, 'utf8'));
    mutate(saved);
    const original = JSON.stringify(saved);
    await writeFile(filename, original);
    await assert.rejects(store.get(created.id), (error) => error instanceof StoreError && error.status === 500);
    await assert.rejects(store.update(created.id, { spec: created.spec, expectedRevision: 2 }), (error) => error instanceof StoreError && error.status === 500);
    assert.equal(await readFile(filename, 'utf8'), original);
    assert.deepEqual(await store.list(), { projects: [], skipped: 1 });
  });
});

test('oversized disk files are rejected before JSON parsing and left intact', async (t) => {
  const { store } = await setup(t);
  const filename = store.filename('oversized');
  await writeFile(filename, '{');
  // Sparse expansion exercises the byte envelope without allocating the payload.
  await truncate(filename, 73_000_000);
  await assert.rejects(store.get('oversized'), (error) => error instanceof StoreError && error.status === 500 && /file size limit/.test(error.message));
  assert.deepEqual(await store.list(), { projects: [], skipped: 1 });
});

test('saved revisions cannot overflow during an update', async (t) => {
  const { store } = await setup(t);
  const created = await store.create(createSpec());
  const filename = store.filename(created.id);
  const saved = JSON.parse(await readFile(filename, 'utf8'));
  saved.revision = Number.MAX_SAFE_INTEGER;
  const original = JSON.stringify(saved);
  await writeFile(filename, original);
  await assert.rejects(store.update(created.id, { spec: created.spec, expectedRevision: saved.revision }), (error) => error instanceof StoreError && error.status === 409);
  assert.equal(await readFile(filename, 'utf8'), original);
});

test('checkpoint payload limits are enforced on persisted data', async (t) => {
  const { store } = await setup(t);
  const created = await store.create(createSpec());
  const saved = JSON.parse(await readFile(store.filename(created.id), 'utf8'));
  saved.history = [{ id: 'checkpoint', label: 'Before edit', createdAt: saved.updatedAt, spec: saved.spec, unexpected: 'x'.repeat(20_000_000) }];
  await writeFile(store.filename(created.id), JSON.stringify(saved));
  await assert.rejects(store.get(created.id), (error) => error instanceof StoreError && error.status === 500);
});

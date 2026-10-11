import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { supportedRuntime } from '../server/runtime.mjs';

test('startup rejects known outdated and unsupported runtimes', () => {
  for (const version of ['20.19.0', '22.23.2', '22.0.0', '24.11.1', '24.20.9', '25.9.0', '26.10.0', '24.21.0-rc.1', 'invalid']) assert.equal(supportedRuntime(version), false, version);
  for (const version of ['22.23.3', '22.24.0', '24.21.0', '24.22.0']) assert.equal(supportedRuntime(version), true, version);
});

test('package and lockfile declare the same supported runtime baseline', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url)));
  assert.equal(pkg.engines.node, '>=22.23.3 <23 || >=24.21.0 <25');
  assert.equal(lock.packages[''].engines.node, pkg.engines.node);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createApp } from '../server/app.mjs';

test('local stop command satisfies the empty-body shutdown contract', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'forma-stop-test-'));
  let acknowledge;
  const shutdown = new Promise(resolve => { acknowledge = resolve; });
  const app = await createApp({ dataDir: directory, onShutdown: acknowledge });
  t.after(async () => { await app.close(); await rm(directory, { recursive: true, force: true }); });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const port = app.server.address().port;
  const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('../scripts/stop.mjs', import.meta.url))], {
    env: { ...process.env, PORT: String(port) }, timeout: 5000,
  });
  assert.match(stdout, /has stopped/);
  await shutdown;
  assert.equal(app.server.listening, false);
});

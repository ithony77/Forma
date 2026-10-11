import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { collectReleaseFiles, isReleasePath, scanText, auditDependencyContract, auditImports, PUBLIC_EMAIL } from '../scripts/release-check.mjs';
import { auditHistory } from '../scripts/release-history.mjs';
async function fixture(t) { const root = await mkdtemp(path.join(tmpdir(), 'forma-public-gate-')); t.after(() => rm(root, { recursive: true, force: true })); return root; }

test('source selection excludes private data, service infrastructure and unreviewed recordings', () => {
  for (const name of ['.env', '.data/project.json', '.git/config', '.agents/private.md', 'docs/generated-ui/.impeccable/design.json', 'docs/screenshots/workspace.png', 'hosted/app.mjs', 'api/compose.mjs', 'vercel.json', 'intro.gif', 'public/intro.mp4', 'public/private.key', 'public/../index.html']) assert.equal(isReleasePath(name), false);
  for (const name of ['README.md', '.env.example', 'public/app.mjs', 'public/favicon.ico', 'tests/fixtures/images.mjs', 'licenses/FANCY.txt', '.github/workflows/verify.yml']) assert.equal(isReleasePath(name), true);
});
test('only the exact approved mailbox is allowed, including encoded forms', () => {
  assert.deepEqual(scanText(PUBLIC_EMAIL + ' mailto:' + PUBLIC_EMAIL), []);
  for (const address of [['person', 'example.com'].join('@'), ['gptchatly+alias', 'gmail.com'].join('@'), ['gptchatly', 'gmail.com.evil'].join('@')]) {
    assert.ok(scanText(address).some(f => f.category === 'email-not-allowed'));
    assert.ok(scanText(address.replace('@', '%40')).some(f => f.category === 'encoded-email-not-allowed'));
    assert.ok(scanText(address.replace('@', '&#64;')).some(f => f.category === 'encoded-email-not-allowed'));
  }
});
test('privacy findings omit matches and cover credentials, machine paths and URLs', () => {
  const samples = [
    ['provider-token', ['sk', 'or', 'v1', 'a'.repeat(40)].join('-')],
    ['private-key', ['-----BEGIN ', 'PRIVATE KEY-----'].join('')],
    ['credential-assignment', ['TYPESAFE_API_KEY', '=' + 'a'.repeat(40)].join('')],
    ['credential-url', ['https://user:pass', 'example.com'].join('@')],
    ['machine-path', ['C:', 'workspace', 'private.txt'].join('/')],
    ['personal-home-path', ['', 'home', 'private-person', 'file'].join('/')]
  ];
  for (const [category, value] of samples) { const findings = scanText('first\n' + value); assert.ok(findings.some(f => f.category === category)); assert.ok(!JSON.stringify(findings).includes(value)); assert.ok(findings.every(f => f.line === 2)); }
});
test('zero-dependency manifest and lock reject extra packages and install hooks', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url))), lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url)));
  assert.deepEqual(auditDependencyContract(manifest, lock), []);
  assert.ok(auditDependencyContract({ ...manifest, dependencies: { surprise: '1.0.0' } }, lock).length);
  assert.ok(auditDependencyContract({ ...manifest, scripts: { ...manifest.scripts, postinstall: 'bad' } }, lock).length);
  assert.ok(auditDependencyContract(manifest, { ...lock, packages: { ...lock.packages, 'node_modules/surprise': {} } }).length);
});
test('collection rejects appended binary data and extra selected-tree files', async t => {
  const root = await fixture(t); await mkdir(path.join(root, 'public')); await mkdir(path.join(root, 'docs/screenshots'), { recursive: true });
  const icon = await readFile(new URL('../public/favicon.ico', import.meta.url)); await writeFile(path.join(root, 'public/favicon.ico'), icon);
  await writeFile(path.join(root, 'docs/screenshots/private.key'), 'private');
  let result = await collectReleaseFiles(root); assert.ok(!result.problems.some(f => f.category === 'unreviewed-binary-asset')); assert.ok(!result.files.has('docs/screenshots/private.key'));
  await writeFile(path.join(root, 'public/favicon.ico'), Buffer.concat([icon, Buffer.from('hidden')])); await writeFile(path.join(root, 'public/private.key'), 'private');
  result = await collectReleaseFiles(root); assert.ok(result.problems.some(f => f.category === 'unreviewed-binary-asset')); assert.ok(result.problems.some(f => f.category === 'unexpected-source-file'));
});
test('collection refuses symlinks without reading their targets', async t => {
  const root = await fixture(t); await mkdir(path.join(root, 'public')); await mkdir(path.join(root, 'outside'));
  await writeFile(path.join(root, 'outside/secret.mjs'), 'private'); await symlink(path.join(root, 'outside'), path.join(root, 'public/link'), 'junction');
  const result = await collectReleaseFiles(root); assert.ok(result.problems.some(f => f.category === 'symlink-not-allowed')); assert.ok(![...result.files.keys()].some(name => name.includes('secret')));
});
test('literal import completeness rejects missing or package imports', () => {
  const files = new Map([['public/app.mjs', Buffer.from("import { x } from '/shared/example.mjs';")], ['shared/example.mjs', Buffer.from('export const x=1;')]]);
  assert.deepEqual(auditImports(files), []); files.delete('shared/example.mjs'); assert.equal(auditImports(files)[0].category, 'unresolved-source-import');
  files.set('public/app.mjs', Buffer.from("import x from 'surprise';")); assert.ok(auditImports(files).length);
});
test('history audit clears approved metadata then rejects a deleted private file and disallowed identities', async t => {
  const root = await fixture(t), git = args => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
  assert.equal((await auditHistory(root)).available, false);
  git(['init', '--initial-branch=main']); git(['config', 'user.name', 'GPTchatly']); git(['config', 'user.email', PUBLIC_EMAIL]);
  await writeFile(path.join(root, 'README.md'), 'Public source'); git(['add', 'README.md']); git(['-c', 'commit.gpgsign=false', 'commit', '-m', 'Synthetic public root']);
  let result = await auditHistory(root); assert.equal(result.commits, 1); assert.deepEqual(result.problems, []);
  git(['-c', 'tag.gpgsign=false', 'tag', '-a', 'v-test', '-m', 'Synthetic tag']); result = await auditHistory(root); assert.equal(result.tags, 1); assert.deepEqual(result.problems, []);
  await writeFile(path.join(root, '.env'), ['API_KEY', '=' + 'a'.repeat(40)].join('')); git(['add', '.env']); git(['-c', 'commit.gpgsign=false', 'commit', '-m', 'Synthetic exposure']);
  git(['rm', '.env']); git(['-c', 'commit.gpgsign=false', 'commit', '-m', 'Synthetic removal']);
  result = await auditHistory(root); assert.ok(result.problems.some(f => f.category === 'excluded-history-path')); assert.ok(result.problems.some(f => f.category === 'credential-assignment'));
  git(['config', 'user.email', ['other', 'example.com'].join('@')]); await writeFile(path.join(root, 'README.md'), 'Change'); git(['add', 'README.md']); git(['-c', 'commit.gpgsign=false', 'commit', '-m', 'Synthetic wrong identity']);
  result = await auditHistory(root); assert.ok(result.problems.some(f => f.category === 'author-email-not-allowed')); assert.ok(result.problems.some(f => f.category === 'committer-email-not-allowed'));
});
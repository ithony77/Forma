/** Audit reachable publication objects, identities and excluded file names. */
import { lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanText, isReleasePath, PUBLIC_EMAIL } from './release-check.mjs';
const ICON_HASH = 'f77786e14998870e6ed60f4952fbbe80abecece8d56c336d79d5ce708ee405f5';
export async function auditHistory(root) {
  try { const metadata = await lstat(path.join(root, '.git')); if (!metadata.isDirectory() || metadata.isSymbolicLink()) throw Error('Publication metadata must be a local directory.'); }
  catch (error) { if (error.code === 'ENOENT') return { available: false, objects: 0, problems: [] }; throw error; }
  const git = args => execFileSync('git', ['-C', root, ...args], { maxBuffer: 200_000_000, timeout: 30000 });
  const entries = git(['rev-list', '--objects', '--all']).toString('utf8').trim().split('\n').filter(Boolean);
  if (entries.length > 20000) throw Error('History exceeds bounded audit size.');
  const ids = entries.map(line => line.split(' ', 1)[0]);
  if (!ids.every(id => /^[a-f0-9]{40,64}$/.test(id))) throw Error('Invalid object inventory.');
  const problems = [];
  const batch = execFileSync('git', ['-C', root, 'cat-file', '--batch'], { input: ids.join('\n') + '\n', maxBuffer: 200_000_000, timeout: 30000 });
  let offset = 0, commits = 0, tags = 0;
  for (const expected of ids) {
    const end = batch.indexOf(10, offset); if (end < 0) throw Error('Truncated object header.');
    const [id, type, rawSize] = batch.subarray(offset, end).toString('utf8').split(' '), size = Number(rawSize);
    if (id !== expected || !Number.isSafeInteger(size) || size < 0 || size > 30_000_000 || end + size + 2 > batch.length) throw Error('Invalid object record.');
    const content = batch.subarray(end + 1, end + 1 + size); offset = end + size + 2;
    if (type === 'tree') continue;
    if (type === 'blob' && createHash('sha256').update(content).digest('hex') === ICON_HASH) continue;
    let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(content); if (text.includes('\0')) throw Error('Binary'); } catch { problems.push({ file: 'history:' + id, category: 'unreviewed-history-binary' }); continue; }
    if (type === 'commit' || type === 'tag') {
      if (type === 'commit') {
        commits++;
        // Inventory each tree, including aliases of an already-seen blob. Tag labels
        // from rev-list are metadata and must never be mistaken for file paths.
        const treeEntries = git(['ls-tree', '-rz', id]).toString('utf8').split('\0').filter(Boolean);
        for (const entry of treeEntries) {
          const item = entry.match(/^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]+)$/);
          if (!item) throw Error('Invalid history tree entry.');
          if (!['100644', '100755'].includes(item[1])) problems.push({ file: 'history:' + id, category: 'nonregular-history-file' });
          if (!isReleasePath(item[4])) problems.push({ file: 'history:' + id, category: 'excluded-history-path' });
        }
      } else tags++;
      const fields = type === 'commit' ? ['author', 'committer'] : ['tagger'];
      for (const field of fields) { const address = text.match(new RegExp('^' + field + ' [^\\n]*<([^>]+)>', 'm'))?.[1]; if (!address || address.toLowerCase() !== PUBLIC_EMAIL.toLowerCase()) problems.push({ file: 'history:' + id, category: field + '-email-not-allowed' }); }
    }
    problems.push(...scanText(text).map(finding => ({ file: 'history:' + id, ...finding })));
  }
  return { available: true, objects: ids.length, commits, tags, problems };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await auditHistory(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')); console.log(result.available ? 'Publication history: ' + result.objects + ' objects; ' + result.problems.length + ' findings.' : 'No publication Git metadata: archive source only.'); for (const problem of result.problems) console.error(problem.file + ': ' + problem.category); process.exitCode = result.problems.length ? 1 : 0; }
  catch { console.error('Publication history audit failed.'); process.exitCode = 1; }
}
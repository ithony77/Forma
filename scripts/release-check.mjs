/** Exact source selection and redacted public-release checks. */
import { lstat, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const PUBLIC_EMAIL = 'GPTchatly@gmail.com';
const ROOT_FILES = new Set(['.env.example', '.gitignore', 'AGENTS.md', 'CONTRIBUTING.md', 'DESIGN.md', 'LICENSE', 'PRODUCT.md', 'README.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md', 'package.json', 'package-lock.json', 'start.cmd', 'start.sh', 'stop.cmd']);
const AUTOMATION = new Set(['.github/workflows/verify.yml', '.github/dependabot.yml']);
const TYPES = { docs: ['.md', '.json'], examples: ['.md', '.json'], licenses: ['.txt', '.md'], public: ['.html', '.css', '.js', '.mjs', '.json', '.svg'], scripts: ['.mjs'], server: ['.mjs'], shared: ['.mjs'], tests: ['.mjs'] };
const PRIVATE_TREES = new Set(['.git', '.data', '.impeccable', '.agents', '.claude', 'artifacts', 'node_modules', 'dist', '.vercel']);
const OMITTED_DOCS = new Set(['docs/test-results', 'docs/screenshots', 'docs/generated-ui/.impeccable']);
const ICON_HASH = 'f77786e14998870e6ed60f4952fbbe80abecece8d56c336d79d5ce708ee405f5';
const REQUIRED = ['README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'AGENTS.md', 'CONTRIBUTING.md', 'SECURITY.md', '.env.example', 'package.json', 'package-lock.json', '.github/workflows/verify.yml', 'server/index.mjs', 'server/app.mjs', 'server/runtime.mjs', 'server/store.mjs', 'public/index.html', 'public/app.mjs', 'public/app.css', 'public/site.css', 'public/site-runtime.js', 'public/interface-runtime.js', 'public/interaction-runtime.js', 'shared/schema.mjs', 'shared/export.mjs', 'shared/notices.mjs', 'scripts/release-check.mjs', 'scripts/release-source.mjs', 'scripts/release-history.mjs', 'tests/release.test.mjs', 'tests/public-edition.test.mjs'];
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'bundledDependencies', 'bundleDependencies', 'overrides', 'resolutions', 'workspaces'];
const empty = value => value === undefined || value !== null && typeof value === 'object' && Object.keys(value).length === 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function auditDependencyContract(manifest, lock) {
  const problems = [];
  if (!record(manifest) || DEPENDENCY_FIELDS.some(key => !empty(manifest[key])) || Object.keys(manifest.scripts ?? {}).some(key => /^(?:preinstall|install|postinstall|prepare|prepublish)$/.test(key))) problems.push({ file: 'package.json', category: 'dependency-free-contract' });
  const root = lock?.packages?.[''];
  if (!record(lock) || lock.lockfileVersion !== 3 || Object.keys(lock.packages ?? {}).length !== 1 || !record(root) || lock.name !== manifest?.name || lock.version !== manifest?.version || root.name !== manifest?.name || root.version !== manifest?.version || JSON.stringify(root.engines) !== JSON.stringify(manifest?.engines) || DEPENDENCY_FIELDS.some(key => !empty(lock[key]) || !empty(root[key])) || root.hasInstallScript) problems.push({ file: 'package-lock.json', category: 'dependency-free-contract' });
  return problems;
}
export function isReleasePath(name) {
  if (AUTOMATION.has(name) || ROOT_FILES.has(name) || name === 'public/favicon.ico') return true;
  const parts = name.split('/');
  if (parts.length < 2 || parts.some(part => !/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(part) || part.includes('..')) || [...OMITTED_DOCS].some(prefix => name === prefix || name.startsWith(prefix + '/'))) return false;
  return TYPES[parts[0]]?.includes(path.posix.extname(name)) ?? false;
}
export function scanText(source) {
  const findings = [];
  const add = (category, offset) => findings.push({ category, line: source.slice(0, offset).split('\n').length });
  const patterns = [
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
    ['provider-token', /\b(?:sk-(?:or-v1-|proj-)?[A-Za-z0-9_-]{32,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]{20,})\b/g],
    ['jwt-token', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
    ['personal-home-path', /(?:[A-Za-z]:[\\/]+(?:Users|Documents and Settings)[\\/]+[^\s\\/'"<>]+|\/(?:Users|home)\/[A-Za-z0-9_.-]+)/g],
    ['machine-path', /(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s'"<>]+|\\\\[A-Za-z0-9_.-]+\\[A-Za-z0-9_$.-]+/g],
    ['credential-url', /\b(?:https?|postgres(?:ql)?|mongodb(?:\+srv)?|redis):\/\/[^\s/:@]+:[^\s/@]+@[^\s/'"<>]+/gi],
    ['credential-assignment', /\b(?:[A-Z_]*(?:API_?KEY|ACCESS_?TOKEN|CLIENT_?SECRET|PASSWORD|AUTH_?TOKEN))["']?[ \t]*[:=][ \t]*["']?[A-Za-z0-9_+./=-]{24,}/gi]
  ];
  for (const [category, pattern] of patterns) for (const match of source.matchAll(pattern)) add(category, match.index);
  for (const match of source.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) if (match[0].toLowerCase() !== PUBLIC_EMAIL.toLowerCase()) add('email-not-allowed', match.index);
  for (const match of source.matchAll(/[^\s<>"']*(?:%[0-9A-F]{2}|&#(?:x[0-9A-F]+|[0-9]+);|&commat;)[^\s<>"']*/gi)) {
    let decoded = match[0].replace(/&commat;/gi, '@').replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, code) => { const value = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code); return value <= 0x10ffff ? String.fromCodePoint(value) : ''; });
    try { decoded = decodeURIComponent(decoded); } catch { /* Malformed escapes stay literal. */ }
    if (decoded !== match[0]) for (const [category, pattern] of patterns) if (new RegExp(pattern.source, pattern.flags).test(decoded)) add(category, match.index);
    if (decoded !== match[0] && [...decoded.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].some(value => value[0].toLowerCase() !== PUBLIC_EMAIL.toLowerCase())) add('encoded-email-not-allowed', match.index);
  }
  return findings;
}
export function auditImports(files) {
  const problems = [];
  for (const [name, content] of files) {
    if (!/\.[cm]?js$/.test(name)) continue;
    const source = content.toString('utf8');
    for (const match of source.matchAll(/^\s*(?:import|export)[^;\n]*?\bfrom\s*['"]([^'"]+)['"]/gm)) {
      const specifier = match[1]; if (specifier.startsWith('node:')) continue;
      const target = specifier.startsWith('/') ? specifier.startsWith('/shared/') ? specifier.slice(1) : 'public' + specifier : specifier.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(name), specifier)) : null;
      if (!target || !files.has(target)) problems.push({ file: name, category: 'unresolved-source-import', line: source.slice(0, match.index).split('\n').length });
    }
  }
  return problems;
}
export async function collectReleaseFiles(root) {
  const files = new Map(), problems = []; let bytes = 0, excludedEntries = 0;
  async function walk(directory, relative = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const name = relative ? relative + '/' + entry.name : entry.name;
      if (!relative && PRIVATE_TREES.has(name) || OMITTED_DOCS.has(name)) { excludedEntries++; continue; }
      const selectedTree = Object.hasOwn(TYPES, name.split('/')[0]) || name.startsWith('.github');
      if (!relative && !ROOT_FILES.has(name) && !selectedTree) { excludedEntries++; continue; }
      const filename = path.join(directory, entry.name), stat = await lstat(filename);
      if (stat.isSymbolicLink()) { problems.push({ file: name, category: 'symlink-not-allowed' }); continue; }
      if (stat.isDirectory()) { if (selectedTree) await walk(filename, name); else problems.push({ file: name, category: 'expected-file' }); continue; }
      if (!stat.isFile() || !isReleasePath(name)) { problems.push({ file: name, category: 'unexpected-source-file' }); continue; }
      if (stat.size > 5_000_000 || bytes + stat.size > 30_000_000) { problems.push({ file: name, category: 'release-size-limit' }); continue; }
      const content = await readFile(filename); bytes += content.length;
      if (name === 'public/favicon.ico') {
        if (createHash('sha256').update(content).digest('hex') !== ICON_HASH) problems.push({ file: name, category: 'unreviewed-binary-asset' });
      } else {
        let source;
        try { source = new TextDecoder('utf-8', { fatal: true }).decode(content); } catch { problems.push({ file: name, category: 'non-utf8-source' }); continue; }
        if (source.includes('\0')) problems.push({ file: name, category: 'binary-in-text-source' });
        problems.push(...scanText(source).map(finding => ({ file: name, ...finding })));
        if (/^(?:public|server|shared)\//.test(name) && /turnstile|challenges\.cloudflare\.com|cf-connecting-ip|x-forwarded-for|ipHash|freeAllowance|hostedClient/i.test(source)) problems.push({ file: name, category: 'excluded-service-in-runtime' });
      }
      files.set(name, content);
    }
  }
  await walk(root);
  for (const name of REQUIRED) if (!files.has(name)) problems.push({ file: name, category: 'required-file-missing' });
  for (const name of ['HYPERUI', 'FANCY', 'WATERMELON', 'USELAYOUTS', 'CULT', 'VELORA', 'FEATHER']) if (!files.has('licenses/' + name + '.txt')) problems.push({ file: 'licenses/' + name + '.txt', category: 'required-file-missing' });
  for (const line of (files.get('.env.example')?.toString('utf8') ?? '').split('\n')) if (/^\s*(?:export\s+)?(?:TYPESAFE_API_KEY|OPENROUTER_API_KEY)\s*=\s*\S+/.test(line)) problems.push({ file: '.env.example', category: 'example-key-must-be-empty' });
  let manifest, lock;
  try { manifest = JSON.parse(files.get('package.json') ?? 'null'); lock = JSON.parse(files.get('package-lock.json') ?? 'null'); } catch { problems.push({ file: 'package.json', category: 'invalid-package-json' }); }
  problems.push(...auditDependencyContract(manifest, lock), ...auditImports(files));
  return { files: new Map([...files].sort(([a], [b]) => a.localeCompare(b, 'en'))), problems, bytes, excludedEntries };
}
export async function checkRelease(root) {
  const result = await collectReleaseFiles(root); let historyAvailable = false;
  try { await lstat(path.join(root, '.git')); historyAvailable = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { ...result, historyAvailable };
}
export function printReleaseCheck(result) {
  console.log('Public source: ' + result.files.size + ' files, ' + result.bytes + ' bytes; ' + result.problems.length + ' findings.');
  for (const problem of result.problems) console.error(problem.file + (problem.line ? ':' + problem.line : '') + ': ' + problem.category);
  console.log('Only selected source bytes are packaged. Private data and original history are excluded.');
  console.log('Pattern checks supplement manual review. Run release:history on the publication repository.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await checkRelease(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')); printReleaseCheck(result); process.exitCode = result.problems.length ? 1 : 0; }
  catch { console.error('Public source check failed.'); process.exitCode = 1; }
}
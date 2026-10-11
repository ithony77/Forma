# Forma

Forma is a local-first website and application UI builder. Describe an interface,
let JEV select bounded design choices, edit the result and export standalone HTML.

The editor includes 105 blocks, 24 reusable elements, 12 styles, 12 palettes and
8 editable example projects. Its interface supports nine languages. Prepared
copy, illustrative metrics and decorative images are editable examples.
JEV chooses existing designs; it does not generate prose, images or executable code.

## Start

Install a supported, patched Node.js LTS release: Node 24.21.0 or later in the
24 line, or Node 22.23.3 or later in the 22 line. Extract the complete source ZIP.
On Windows, double-click **start.cmd**. On macOS/Linux, run **sh start.sh**.
Alternatively, run **node server/index.mjs --open** from the extracted folder.
The editor opens at **http://127.0.0.1:4318**. Keep the terminal open while working.
Stop with Ctrl+C; Windows also includes stop.cmd.

The runtime needs no package installation or build. If the port is occupied,
set PORT in your own .env file. The server listens only on loopback.

Choose **Offline demo** to try editing, saving and export without a key.
For live designs, open **Connect JEV**, test your TypeSafe or OpenRouter key, then
choose **Build with JEV**. Tests and designs may incur provider charges.
Only explicit connection tests and live builds contact a provider. A design
normally uses two calls. Provider errors remain errors; demo is an explicit mode.

## Explore the library

Open **Components** to browse blocks, interactive controls, reusable elements,
styles and examples. Open an example as a separate project. Select a section to
insert an element, change its tools/content slot or edit its labels and options.
Body sections can repeat; each page has up to 12 sections and each project up to
8 pages. Styles respect locked design settings.

Try: Create a software product showcase with a browser-frame hero, tabbed features,
a filterable gallery, image comparison, monthly/annual pricing and searchable FAQ.
Use Frosted Glass, the Ink palette, a wide page and expressive motion.

Use Inspect for editing and Interact for visitor controls. Dialogs, tabs, filters,
sliders and other controls respect keyboard operation and reduced-motion settings.
App screens provide temporary local interface state. Connecting real accounts,
payments, AI responses or shared data requires your own backend.

## Projects, keys and export

Projects are saved under .data in the app directory, with browser backup support.
Project imports are validated and version-one projects migrate to version two.
Use JSON backups for portability. Storage is unencrypted; protect your computer
account and browser profile.

A key that passes a test is saved in this browser profile until **Remove key**.
Page load restores it into local server memory without probing a provider. Keys
are excluded from projects and exports. Anyone with profile access can read a
saved key. Remove it on shared computers. See [SECURITY.md](SECURITY.md).

Export produces self-contained HTML pages, editable project JSON, reference code
and license notices. Review copy, image rights, links and contact details before
publishing. Contact forms prepare a mailto draft only after you supply a recipient.
Exported pages need no CDN, remote fonts or provider credentials.

## Development and release

Run npm ci --ignore-scripts, npm test, npm run check, npm run build and
npm run release:check. The lockfile contains zero installed dependencies.
Optional browser tests use an existing Playwright installation and Chromium;
setup is documented in [CONTRIBUTING.md](CONTRIBUTING.md).

Run npm run release:source to create a selected source ZIP and SHA-256 manifest.
Run npm run release:history in the publication repository. Release checks reject
private files, credentials, personal machine paths and emails other than
GPTchatly@gmail.com. They supplement manual source and asset review.
Do not distribute the whole working folder or copy private Git history.

See [architecture](docs/ARCHITECTURE.md), [UI expansion](docs/UI-EXPANSION.md),
[verification](docs/TEST-REPORT.md) and [release notes](docs/RELEASE-NOTES.md).

## License and contact

Forma is MIT licensed. Preserve LICENSE, THIRD_PARTY_NOTICES.md and the bundled
notices when redistributing adapted code. Contact: GPTchatly@gmail.com.
Source: https://github.com/GPTchatly/Forma.

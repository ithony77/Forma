# Architecture

## Native runtime

The browser editor talks to a dependency-free Node server on loopback. The server
owns provider credentials in memory, bounded composition, local project files,
preview rendering and export. public/app.mjs uses /api/status to obtain a random
process-scoped application token; other API requests require X-Forma-Token.
Every request passes Host and Origin checks. The server rejects unknown envelope
fields and enforces raw byte limits before parsing JSON.

server/index.mjs binds only to 127.0.0.1. server/app.mjs serves an explicit static
asset map and local APIs. No client network address is used for accounting.
The API has process-wide rolling windows and active-request limits; provider work
is separately serialized and bounded. These controls protect one local process.

server/store.mjs validates saved specifications, revisions and checkpoints and
uses atomic file replacement. The browser retains IndexedDB backups. Credentials
are excluded from project state. One process owns a store directory at a time.

## Bounded composition

Live JEV is a text-only choice evaluator using fixed TypeSafe/OpenRouter endpoints.
Pass one chooses direction, journey and theme. Pass two chooses component variants,
presentation and internal elements. The limit is 160 questions per pass. Larger
compositions compact nonselected choices into bounded recipes. Images are omitted
from provider context. Locks, ordering, revisions and acceptance checks run in
ordinary code outside the evaluator. Failure never silently switches to demo.

Offline demo selects finite choices through labeled keyword rules with zero
provider calls. New design creates a new project; refinement and redesign preserve
validated authored state as documented in README.md.

## Shared schema, renderer and export

shared/schema.mjs validates all imported and model-influenced specifications.
Version two migrates version-one projects while preserving authored content.
Projects have up to eight pages and 12 sections per page; body sections can repeat
and use stable IDs. Navigation, hero/application screen and footer are anchored.
Element slots hold at most four elements per content section, with bounded options.

The catalog contains 105 MIT blocks, 24 elements and 12 coordinated style presets.
shared/render.mjs and expansion-render.mjs escape authored text and emit only
approved markup. Uploaded raster data is validated by shared/raster.mjs. URLs and
media dimensions are bounded. No arbitrary script, CSS or remote asset is accepted.

The preview runs in an iframe with allow-scripts and without allow-same-origin.
Parent and child validate sending windows, channels, pages and bounded messages.
The fixed site, interface and interaction runtimes are concatenated in that order
and normalized to LF before hashing and embedding. CSP authorizes those bytes.
Inspect and Interact have distinct editing/visitor behavior. Temporary visitor
state never changes the canonical project. Keyboard and reduced-motion controls
remain functional. Export shares the renderer and shared/export.mjs; HTML files
are self-contained, with license notices and fixed runtimes.

## Release contract

scripts/release-check.mjs selects source bytes, rejects private paths and scans
credentials, personal machine paths and non-approved emails. It validates the
zero-dependency lockfile and literal module imports. scripts/release-source.mjs
archives those exact buffers with a SHA-256 manifest. scripts/release-history.mjs
checks all reachable publication objects and identity metadata. Neither tool
publishes. Runtime, tests, examples, docs and required license notices are included.

See UI-EXPANSION.md, INTERACTIONS.md, ELEMENT-EDITING.md and
DRAG-AND-DROP-DESIGN.md for the editing and component contracts.

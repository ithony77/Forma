# Forma 0.2.0 public-edition verification

Verified October 11, 2026 after the complete implementation phase.

## Executed checks

- Windows, Node 24.21.0: 483 tests passed, zero failed, zero skipped. All three
  optional Chromium integration tests were enabled.
- Linux, Node 24.21.0 under WSL: 480 tests passed, zero failed; the three Chromium
  tests were skipped because no Linux test browser was configured. This does not
  claim Linux browser coverage or Node 22 execution.
- Both platforms: 98 JavaScript modules passed syntax checks; the complete
  selected public source passed the privacy, dependency and import checks.
- Windows npm ci --ignore-scripts: zero installed dependencies, zero vulnerabilities.
- npm run build and release:check passed. The build validates the complete source
  distribution without producing a hosted-service bundle.
- Gitleaks 8.30.1 independently scanned the public source with full redaction and
  reported zero leaks. The exact source archive and intended publication history
  are independently checked before publication.

## Functional coverage

The suite exercises all 105 catalog blocks, 24 reusable elements, 12 palettes,
12 styles and eight editable examples; schema migration, repeated sections,
editing, locks, undo/redo, project revisions, persistence, source rendering and
standalone export. Real Chromium checks cover keyboard/focus behavior, dialogs,
tabs, filtering, sliders, Inspect/Interact transitions, library previews,
mobile overflow, reduced motion and no-script readable content.

The public-edition browser regression verifies zero provider calls at startup,
one explicit synthetic key test, saved-key restoration without another probe,
Offline demo creation, saved projects, export without credentials or an authored
contact recipient, Remove key, zero external browser requests and zero page errors.
Synthetic provider fixtures are labeled and never establish live model results.
Standalone export interaction tests make zero external requests.

## Release and privacy coverage

Source checks reject unexpected selected-tree files, symbolic links, modified
binary assets, populated credential examples, dependencies and missing imports.
The only binary source asset is the previously reviewed, hash-locked favicon.
Personal desktop recordings and unreviewed media are excluded.

Tests verify the exact email allowlist, common encoded addresses, secret formats,
machine paths, redacted findings, clean author/committer/tagger metadata and
historical detection of a credential file even after deletion. The runtime ignores
client forwarding-header identities and preserves local origin/token protections.

The Windows/Linux Node 22/24 GitHub workflow is prepared, including pinned test-only
Playwright and Chromium setup. It has not run on GitHub for this candidate.
No live provider test, deployment or public history replacement is claimed.
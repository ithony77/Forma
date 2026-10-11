# Contributing

Use the patched Node.js LTS versions in package.json. The local app runs without
installation or build. Read AGENTS.md and SECURITY.md before changing a boundary.

Run npm ci --ignore-scripts, npm test, npm run check, npm run build and
npm run release:check after changes. Source packaging uses npm run release:source.
The build command validates the complete distributable source.

Browser checks are optional for ordinary unit runs but required for a release.
Point FORMA_PLAYWRIGHT_MODULE to an existing playwright-core index.mjs and
FORMA_TEST_BROWSER to an installed Chromium executable. These values belong in
your local shell, never in source. Then run npm test. CI installs the pinned
test-only Playwright package in a temporary runner directory and runs the same
checks on Windows and Linux. No testing tool becomes an app dependency.

Use isolated temporary project storage and synthetic provider responses. Do not
call paid providers without a deliberate owner-approved test. Preserve escaping,
validation, fixed endpoints, application tokens, same-origin checks and sandboxing.
Keep credentials, real projects, screenshots and personal paths out of patches.
Required upstream license attribution must stay intact.

Describe behavior, verification and remaining limitations. The maintained public
history uses GPTchatly and GPTchatly@gmail.com for author, committer and tagger.
External contributions are reviewed and incorporated as curated maintainer
commits with credit in release notes; do not import arbitrary contributor or bot
history into the maintained release. GitHub user-submitted comments and pull
request metadata are outside the release archive and require separate moderation.

The release scanner allows only the documented public email and reports locations
without matched values. Run release:history in the publication repository to
inspect all reachable objects, commits and annotated tags. A normal source scan
does not certify another repository's history.

# Repository working rules

Forma is a dependency-free, native Node/browser local site builder.
Read README.md, docs/ARCHITECTURE.md and SECURITY.md before changing a flow.

- Preserve installation-free startup and native ES modules. Add no runtime
  dependency, remote font, CDN asset or dynamically installed package.
- Live JEV uses fixed real provider endpoints. Never silently fall back to demo.
  Synthetic transports belong only in tests; report measured usage honestly.
- JEV selects bounded designs. Prepared copy and imagery are labeled examples.
- Imported and model-influenced data must pass shared/schema.mjs. Preserve
  text escaping, URL allowlists, fixed rendering and image validation.
- Preserve loopback binding, Host/Origin checks, application tokens, raw body
  limits, deadlines, concurrency bounds, CSP hashes and iframe isolation.
  Local process safety windows are independent of visitor network addresses.
- Never execute user scripts. Keep preview source/channel validation and replay
  checks. Locks and revision checks are enforced outside the model.
- A successfully tested personal key may remain in browser localStorage until
  Remove key. Restore it without a provider call. Never include it in projects,
  imports, exports, logs or source artifacts.
- Add UI through catalog, renderer, CSS, prepared content and meaningful tests.
  Preserve required MIT attribution and distinguish adapted from original work.
- After completing changes, run npm ci --ignore-scripts, npm test, npm run check,
  npm run build, npm run release:check and npm run release:source. Audit publication
  history with npm run release:history. Update docs/TEST-REPORT.md only with actual
  evidence. Fixtures do not prove live provider behavior or untested platforms.
- Public files and maintained Git metadata allow only GPTchatly@gmail.com.
  Use relative setup paths. Keep private artifacts and personal data outside the
  source selection. Do not import development history into a public release.
- Keep changes local; publishing and history replacement require owner instruction.

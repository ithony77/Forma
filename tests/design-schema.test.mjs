import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpec } from '../shared/content.mjs';
import { validateSpec, validateCompose } from '../shared/schema.mjs';
import { DEFAULT_PRESENTATION } from '../shared/design.mjs';

test('legacy version-one projects normalize new design settings without content loss', () => {
  const legacy = createSpec('Existing business');
  delete legacy.theme.typeScale; delete legacy.theme.width;
  for (const section of legacy.sections) delete section.presentation;
  legacy.sections[1].title = 'A reviewed headline'; legacy.sections[1].draft = false;
  const before = structuredClone(legacy), normalized = validateSpec(legacy);
  assert.equal(normalized.theme.typeScale, 'balanced'); assert.equal(normalized.theme.width, 'standard');
  assert.ok(normalized.sections.every((section) => JSON.stringify(section.presentation) === JSON.stringify(DEFAULT_PRESENTATION)));
  assert.equal(normalized.sections[1].title, 'A reviewed headline'); assert.equal(normalized.sections[1].draft, false);
  assert.deepEqual(legacy, before);
  assert.deepEqual(validateSpec(normalized), normalized);
});

test('new style inputs reject unbounded CSS, objects, null and unexpected properties', () => {
  for (const mutate of [
    (s) => { s.theme.width = '100vw; background:url(https://evil.example)'; },
    (s) => { s.theme.typeScale = null; },
    (s) => { s.sections[1].presentation.tone = 'red'; },
    (s) => { s.sections[1].presentation.heading = {}; },
    (s) => { s.sections[1].presentation = null; },
    (s) => { s.sections[1].presentation.css = 'display:none'; },
    (s) => { s.sections[1].presentation = JSON.parse('{"__proto__": {"tone":"contrast"}}'); }
  ]) { const spec = createSpec(); mutate(spec); assert.throws(() => validateSpec(spec)); }
});

test('redesign and new locks cross the same schema boundary as other operations', () => {
  const request = validateCompose({ mode: 'demo', operation: 'redesign', prompt: 'Reimagine this as a restrained portfolio.', spec: createSpec(), locks: { width: true, typeScale: true } });
  assert.equal(request.operation, 'redesign'); assert.equal(request.locks.width, true); assert.equal(request.locks.typeScale, true);
  assert.throws(() => validateCompose({ ...request, operation: 'execute' }));
});

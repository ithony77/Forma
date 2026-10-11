import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpec } from '../shared/content.mjs';
import { createPage } from '../shared/pages.mjs';
import { validateSpec, validateCompose } from '../shared/schema.mjs';
import { DEFAULT_ELEMENTS, ELEMENT_CONTROLS, elementFieldsFor, elementOptionsFor } from '../shared/elements.mjs';
import { CONTENT_ICONS, itemIconName, icon } from '../shared/icons.mjs';

test('legacy specs preserve original item icons and normalize all nested slot defaults', () => {
  const spec = createSpec();
  for (const section of spec.sections) { delete section.elements; for (const item of section.items) delete item.icon; }
  const before = structuredClone(spec), normalized = validateSpec(spec);
  assert.deepEqual(spec, before);
  for (const section of normalized.sections) assert.deepEqual(section.elements, DEFAULT_ELEMENTS);
  const features = normalized.sections.find((section) => section.group === 'features');
  assert.deepEqual(features.items.map(itemIconName), ['circle', 'layers', 'spark']);
  assert.deepEqual(validateSpec(normalized), normalized);
});

test('each content icon is a closed local SVG choice and prototype names cannot become markup', () => {
  for (const name of Object.keys(CONTENT_ICONS)) {
    const spec = createSpec(); spec.sections.find((section) => section.group === 'features').items[0].icon = name;
    assert.equal(validateSpec(spec).sections.find((section) => section.group === 'features').items[0].icon, name);
  }
  assert.equal(icon('__proto__'), icon('circle'));
  assert.equal(icon('constructor'), icon('circle'));
  for (const value of ['<svg onload="alert(1)">', 'https://example.com/icon.svg', '__proto__', 'constructor', '', null, {}, ['leaf']]) {
    const spec = createSpec(); spec.sections.find((section) => section.group === 'features').items[0].icon = value;
    assert.throws(() => validateSpec(spec), /item icon/);
  }
});

test('element library values reject unregistered code, styles, text and nested properties', () => {
  for (const mutate of [
    (section) => { section.elements = null; },
    (section) => { section.elements.html = '<button>Injected</button>'; },
    (section) => { section.elements.buttonStyle = 'url(https://evil.example)'; },
    (section) => { section.elements.buttonIcon = '<svg/>'; },
    (section) => { section.elements.buttonLabel = 'Unregistered prose'; },
    (section) => { section.elements.columns = 4; },
    (section) => { section.elements.contentAlign = { style: 'fixed' }; },
    (section) => { section.elements = JSON.parse('{"__proto__":{"columns":"four"}}'); }
  ]) { const spec = createSpec(); mutate(spec.sections[1]); assert.throws(() => validateSpec(spec)); }
});

test('element applicability matches actual slots and available pricing items', () => {
  assert.ok(elementFieldsFor('features').includes('columns'));
  assert.ok(!elementFieldsFor({ group: 'features', block: 'features-list' }).includes('columns'));
  assert.ok(!elementFieldsFor({ group: 'hero', block: 'hero-centered' }).includes('decoration'));
  assert.ok(!elementFieldsFor({ group: 'contact', block: 'contact-form' }).includes('primaryAction'));
  assert.ok(elementFieldsFor({ group: 'contact', block: 'contact-simple' }).includes('primaryAction'));
  assert.deepEqual(Object.keys(elementOptionsFor({ items: [{}, {}] }, 'featuredItem')), ['default', 'none', 'first', 'second']);
  for (const control of Object.values(ELEMENT_CONTROLS)) assert.ok(Object.hasOwn(control.options, 'default'));
});

test('selection context is validated within the requested page before provider work', () => {
  const spec = createSpec(); spec.pages.push(createPage(spec, { id: 'article', title: 'Article', slug: 'article', template: 'article' }));
  const request = { mode: 'demo', operation: 'edit', prompt: 'Change this icon', spec, selectedSectionId: 'features', selectedItemIndex: 1 };
  assert.equal(validateCompose(request).selectedItemIndex, 1);
  for (const changes of [{ pageId: 'article' }, { selectedSectionId: 'missing' }, { selectedItemIndex: -1 }, { selectedItemIndex: 8 }, { selectedItemIndex: '1' }, { selectedItemIndex: null }, { selectedSectionId: undefined }]) assert.throws(() => validateCompose({ ...request, ...changes }));
  const normalized = validateCompose({ ...request, selectedSectionId: undefined, selectedItemIndex: undefined });
  assert.ok(!Object.hasOwn(normalized, 'selectedSectionId'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { CATALOG, GROUPS } from '../shared/catalog.mjs';
import { createSpec, makeSection } from '../shared/content.mjs';
import { validateSpec } from '../shared/schema.mjs';
import { renderBody } from '../shared/render.mjs';
import { createExportFiles } from '../shared/export.mjs';
import { BUNDLED_NOTICES } from '../shared/notices.mjs';
import { partsFor } from '../shared/parts.mjs';
import { compose } from '../server/composer.mjs';
import { demoEvaluate } from '../server/demo.mjs';
const request = (spec, prompt) => ({ spec, prompt, operation: 'edit', mode: 'demo', locks: {} });

test('legacy projects default finite interactions and reject code-shaped interaction choices', () => {
  const legacy = createSpec();
  for (const section of legacy.sections) { delete section.elements.actionMotion; delete section.elements.cardInteraction; delete section.elements.entrance; delete section.interface.tabStyle; }
  const normalized = validateSpec(legacy);
  assert.ok(normalized.sections.every(section => section.elements.entrance === 'default' && section.interface.tabStyle === 'default'));
  for (const key of ['actionMotion', 'cardInteraction', 'entrance']) {
    const bad = structuredClone(normalized); bad.sections[1].elements[key] = '<script>bad</script>';
    assert.throws(() => validateSpec(bad));
  }
  normalized.theme.motion = 'expressive'; assert.equal(validateSpec(normalized).theme.motion, 'expressive');
  const app = makeSection('hero', 'app-dashboard'); app.interface.tabStyle = 'sliding';
  assert.ok(!partsFor(app).some(part => part.partKey === 'tabStyle'), 'tab treatment is not a removable content part');
});

test('new renderer paths retain escaped copy, item identities and hidden-part contracts', () => {
  for (const block of CATALOG.filter(block => block.capabilities.sources.length)) {
    const spec = createSpec(); spec.sections = [makeSection(block.group, block.id)];
    const section = spec.sections[0]; section.items[0].body = '</p><img src=x onerror=bad()>';
    const first = section.items[0]; first.removedParts = ['meta', 'price'];
    const preview = renderBody(spec, { preview: true }), exported = renderBody(spec);
    assert.ok(preview.includes(`data-item-id="${first.id}"`));
    assert.ok(exported.includes('&lt;img src=x onerror=bad()&gt;'));
    assert.ok(!exported.includes('data-item-id='));
    if (block.group === 'gallery') assert.ok(exported.includes('data-gallery-item'));
  }
});

test('offline demo selects every new block while preserving authored content and unrelated sections', async () => {
  const cases = [['features','Spotlight features','features-spotlight'],['services','Revealing services component','services-reveal'],['gallery','Swipeable gallery component','gallery-carousel'],['gallery','Fanned photo gallery component','gallery-stack'],['process','Stacked process component','process-stacked']];
  for (const [group,prompt,id] of cases) {
    const spec = validateSpec(createSpec()), before = structuredClone(spec);
    const output = await compose(request(spec,prompt),demoEvaluate);
    assert.equal(output.spec.sections.find(section => section.group === group).block,id);
    assert.deepEqual(output.spec.sections.find(section => section.group === group).items,before.sections.find(section => section.group === group).items);
    assert.deepEqual(output.spec.sections.filter(section => section.group !== group),before.sections.filter(section => section.group !== group));
    assert.deepEqual(spec,before); assert.equal(output.report.calls,0);
  }
});

test('interaction choices remain bounded, locked-safe and available to both JEV passes', async () => {
  const spec = createSpec(); spec.sections = GROUPS.filter(group=>!['testimonials','team','logos','stats'].includes(group)).map(group => makeSection(group));
  for (const section of spec.sections) if (section.items.length) section.items = Array.from({length:8},(_,index) => ({...structuredClone(section.items[index%section.items.length]),id:`${section.group}-item-${index}`}));
  const sizes=[];
  await compose(request(spec,'Use spotlight feature cards and a swipeable gallery component.'),async input => {
    sizes.push(Object.keys(input.questions).length);
    assert.ok(Object.keys(input.questions).length <= 160);
    assert.ok(Object.values(input.questions).every(question => Object.keys(question.criteria).length <= 255));
    return demoEvaluate(input);
  });
  assert.equal(sizes.length,2);
  spec.sections.find(section => section.group === 'gallery').locked=true;
  const before=validateSpec(spec), output=await compose(request(spec,'Fanned photo gallery component.'),demoEvaluate);
  assert.deepEqual(output.spec.sections.find(section => section.group === 'gallery'),before.sections.find(section => section.group === 'gallery'));
});

test('explicit action, entrance and application tab requests select real finite controls', async () => {
  const spec=createSpec();
  const output=await compose(request(spec,'Add an animated underline to hero buttons; add a rise entrance to features.'),demoEvaluate);
  assert.equal(output.spec.sections.find(section=>section.group==='hero').elements.actionMotion,'underline');
  assert.equal(output.spec.sections.find(section=>section.group==='features').elements.entrance,'rise');
  const app=createSpec();app.sections=[makeSection('hero','app-board')];
  const tabs=await compose(request(app,'Show sliding application tabs.'),demoEvaluate);
  assert.equal(tabs.spec.sections[0].interface.tabStyle,'sliding');
  assert.equal(tabs.spec.sections[0].interface.tabs,'show');
});

test('all notices accompany each standalone page and fixed runtime hash without remote assets', async () => {
  const css=await readFile(new URL('../public/site.css',import.meta.url),'utf8');
  const script=(await Promise.all(['site-runtime.js','interface-runtime.js','interaction-runtime.js'].map(name => readFile(new URL(`../public/${name}`,import.meta.url),'utf8')))).join('\n').replace(/\r\n?/g,'\n');
  const scriptHash=createHash('sha256').update(script).digest('base64');
  const notices=Object.fromEntries(await Promise.all(BUNDLED_NOTICES.map(async name => [name,await readFile(new URL(`../licenses/${name}.txt`,import.meta.url),'utf8')])));
  const originalLicense=await readFile(new URL('../LICENSE',import.meta.url),'utf8');
  const files=createExportFiles(createSpec(),{css,script,scriptHash,notices,originalLicense});
  for (const name of BUNDLED_NOTICES) { assert.equal(files[`licenses/${name}.txt`],notices[name]); assert.ok(files['index.html'].includes(name)); }
  assert.ok(files['index.html'].includes(`sha256-${scriptHash}`));
  assert.ok(!/<(?:script|link)\b[^>]*(?:src|href)="https?:/i.test(files['index.html']));
});

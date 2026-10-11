import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpec, makeSection } from '../shared/content.mjs';
import { GROUPS } from '../shared/catalog.mjs';
import { createPage, getPageSpec, removeSection } from '../shared/pages.mjs';
import { validateSpec } from '../shared/schema.mjs';
import { removeItem, setPartRemoved } from '../shared/structure.mjs';
import { compose, explicitOmissions } from '../server/composer.mjs';
import { canvasPlanning } from '../server/canvas-edits.mjs';
import { demoEvaluate } from '../server/demo.mjs';

const section = (spec, group) => spec.sections.find((entry) => entry.group === group);
const request = (spec, prompt, operation = 'edit') => ({ spec, prompt, operation, mode: 'demo', locks: {} });
const answer = (choice, confidence = null) => ({ type: 'choice', choice, confidence, probabilities: {} });

test('empty pages stay empty in refinement and redesign; absent headline destinations warn without crashing', async () => {
  const spec = validateSpec({ ...createSpec(), sections: [] });
  for (const operation of ['edit', 'redesign']) {
    const output = await compose(request(spec, 'Make the palette ocean blue.', operation), demoEvaluate);
    assert.deepEqual(output.spec.sections, []);
    assert.equal(output.spec.theme.palette, 'ocean');
  }
  const headline = await compose(request(spec, 'Headline: "A new headline"'), demoEvaluate);
  assert.deepEqual(headline.spec.sections, []);
  assert.ok(headline.warnings.some((warning) => warning.includes('no Hero')));
  assert.ok(headline.warnings.some((warning) => warning.includes('No supported changes')));
});

test('Hero and Navigation can be explicitly deleted and remain absent after later composition', async () => {
  const initial = validateSpec(createSpec());
  const removed = await compose(request(initial, 'Delete the hero and nav.'), demoEvaluate);
  assert.ok(!section(removed.spec, 'hero'));
  assert.ok(!section(removed.spec, 'navigation'));
  for (const operation of ['edit', 'redesign']) {
    const next = await compose(request(removed.spec, 'Make the page editorial.', operation), demoEvaluate);
    assert.ok(!section(next.spec, 'hero'));
    assert.ok(!section(next.spec, 'navigation'));
  }
  const restored = await compose(request(removed.spec, 'Add the hero section.'), demoEvaluate);
  assert.ok(section(restored.spec, 'hero'));
  assert.deepEqual([...explicitOmissions('Do not delete hero. Never remove navigation.')], []);
});

test('new composition includes Hero by default but can explicitly omit every top-level section', async () => {
  const included = await compose(request(createSpec(), 'Create a simple website.', 'create'), demoEvaluate);
  assert.ok(section(included.spec, 'hero'));
  const omitted = await compose(request(createSpec(), 'Create a website without hero, navigation and footer.', 'create'), demoEvaluate);
  assert.ok(!section(omitted.spec, 'hero'));
  assert.ok(!section(omitted.spec, 'navigation'));
  assert.ok(!section(omitted.spec, 'footer'));
});

test('section deletion repairs local and sibling page fragment links before whole-site validation', async () => {
  const spec = validateSpec(createSpec());
  spec.pages.push(createPage(spec, { id: 'child', title: 'Child', slug: 'child' }));
  spec.brand.href = 'page:home#hero';
  section(spec, 'features').items[0].href = '#hero';
  section(spec.pages[0], 'hero').href = 'page:home#hero';
  const output = await compose(request(spec, 'Remove the hero section.'), demoEvaluate);
  assert.equal(output.spec.brand.href, 'page:home');
  assert.equal(section(output.spec, 'features').items[0].href, '');
  assert.equal(section(output.spec.pages[0], 'hero').href, 'page:home');
  assert.doesNotThrow(() => validateSpec(output.spec));
});

test('manual part and item deletions survive unrelated edits, redesign and contradictory icon/button style choices', async () => {
  let spec = validateSpec(createSpec());
  const feature = section(spec, 'features'), itemId = feature.items[0].id;
  spec = setPartRemoved(spec, { sectionId: 'features', itemId }, 'icon', true).page;
  spec = setPartRemoved(spec, { sectionId: 'hero' }, 'action', true).page;
  spec = removeItem(spec, 'features', feature.items[1].id).page;
  spec = removeSection(spec, 'home', 'navigation');
  const before = structuredClone(spec);
  const evaluate = async (input) => {
    assert.ok(!input.questions.icon_features_0, 'removed icon is not offered as an ordinary replacement');
    const response = await demoEvaluate(input);
    if (response.answers.element_hero_primaryAction) response.answers.element_hero_primaryAction = answer('show');
    return response;
  };
  const output = await compose(request(spec, 'Make the page expressive.', 'redesign'), evaluate);
  assert.deepEqual(section(output.spec, 'hero').removedParts, ['action']);
  assert.deepEqual(section(output.spec, 'features').items[0].removedParts, ['icon']);
  assert.deepEqual(section(output.spec, 'features').items.map((item) => item.id), section(before, 'features').items.map((item) => item.id));
  assert.ok(!section(output.spec, 'navigation'));
  assert.deepEqual(spec, before);
});

test('bounded inner deletion supports separate parts and a named ordinal whole item', async () => {
  const initial = validateSpec(createSpec());
  const parts = await compose(request(initial, 'Remove the heading from the hero; remove the description from the hero.'), demoEvaluate);
  assert.deepEqual(section(parts.spec, 'hero').removedParts, ['heading', 'body']);
  assert.equal(section(parts.spec, 'hero').title, section(initial, 'hero').title);
  for (const verb of ['Delete', 'Remove']) {
    const buttonText = await compose(request(initial, `${verb} the hero button text.`), demoEvaluate);
    assert.deepEqual(section(buttonText.spec, 'hero').removedParts, ['buttonLabel']);
    assert.equal(section(buttonText.spec, 'hero').elements.primaryAction, 'default');
    const buttonIcon = await compose(request(initial, `${verb} the hero button icon.`), demoEvaluate);
    assert.deepEqual(section(buttonIcon.spec, 'hero').removedParts, ['buttonIcon']);
    assert.equal(section(buttonIcon.spec, 'hero').elements.primaryAction, 'default');
    assert.equal(section(buttonIcon.spec, 'hero').elements.buttonIcon, 'default');
  }
  const item = await compose(request(initial, 'Delete the first feature item.'), demoEvaluate);
  assert.deepEqual(section(item.spec, 'features').items.map((entry) => entry.id), section(initial, 'features').items.slice(1).map((entry) => entry.id));
  assert.deepEqual(item.spec.theme, initial.theme);
  assert.ok(item.report.changes.some((change) => change.target === 'sections.features.items.order'));
});

test('synthetic model deletion choices are validated twice and low-confidence removal stays unchanged', async () => {
  const initial = validateSpec(createSpec());
  for (const uncertainPhase of ['plan', 'apply']) {
    const evaluate = async (input) => {
      const response = await demoEvaluate(input);
      if (input.questions.canvas_target_0) {
        const target = Object.entries(input.state.canvas_targets).find(([, value]) => value.kind === 'remove-element' && value.sectionId === 'hero');
        response.answers.canvas_target_0 = answer(target[0], uncertainPhase === 'plan' ? 0.1 : 1);
      }
      if (input.questions.canvas_0_remove) {
        const action = input.state.canvas_actions.find((entry) => entry.slot === 0);
        const target = Object.entries(action.options).find(([, value]) => value.partKey === 'body' && value.itemId === undefined);
        response.answers.canvas_0_remove = answer(target[0], uncertainPhase === 'apply' ? 0.1 : 1);
      }
      return response;
    };
    const output = await compose(request(initial, 'Remove the hero description.'), evaluate);
    assert.deepEqual(section(output.spec, 'hero').removedParts, []);
    assert.ok(output.warnings.some((warning) => warning.includes('uncertain')));
  }
});

test('deictic deletion preserves selected part identity, while an explicit card request removes its owner', async () => {
  const initial = validateSpec(createSpec());
  const feature = section(initial, 'features'), featureId = feature.items[0].id;
  const headingRequest = { ...request(initial, 'Delete this element.'), selectedSectionId: feature.id, selectedItemId: featureId, selectedPartKey: 'heading' };
  const heading = await compose(headingRequest, demoEvaluate);
  assert.equal(section(heading.spec, 'features').items.length, feature.items.length);
  assert.deepEqual(section(heading.spec, 'features').items[0].removedParts, ['heading']);
  assert.deepEqual(section(heading.spec, 'features').items.slice(1), feature.items.slice(1));
  const buttonLabel = await compose({ ...request(initial, 'Delete this element.'), selectedSectionId: 'hero', selectedPartKey: 'buttonLabel' }, async (input) => {
    assert.equal(input.state.selection.partKey, 'buttonLabel');
    return demoEvaluate(input);
  });
  assert.deepEqual(section(buttonLabel.spec, 'hero').removedParts, ['buttonLabel']);
  const buttonIcon = await compose({ ...request(initial, 'Remove this icon.'), selectedSectionId: 'hero', selectedPartKey: 'buttonIcon' }, demoEvaluate);
  assert.deepEqual(section(buttonIcon.spec, 'hero').removedParts, ['buttonIcon']);
  assert.equal(section(buttonIcon.spec, 'hero').elements.primaryAction, 'default');
  const card = await compose({ ...headingRequest, prompt: 'Delete this card.' }, demoEvaluate);
  assert.deepEqual(section(card.spec, 'features').items.map((entry) => entry.id), feature.items.slice(1).map((entry) => entry.id));
  const ambiguous = await compose({ ...headingRequest, selectedPartKey: undefined }, demoEvaluate);
  assert.deepEqual(section(ambiguous.spec, 'features'), feature);
});

test('locked owners and failed second passes cannot remove content or mutate the request', async () => {
  const initial = validateSpec(createSpec());
  section(initial, 'hero').locked = true;
  section(initial, 'features').locked = true;
  const output = await compose(request(initial, 'Delete the hero; remove the first feature item.'), async (input) => {
    assert.ok(!input.questions.include_hero);
    assert.ok(!Object.values(input.state.canvas_targets || {}).some((target) => ['hero', 'features'].includes(target.sectionId)));
    return demoEvaluate(input);
  });
  assert.deepEqual(section(output.spec, 'hero'), section(initial, 'hero'));
  assert.deepEqual(section(output.spec, 'features'), section(initial, 'features'));
  const unlocked = validateSpec(createSpec()), before = structuredClone(unlocked);
  let calls = 0;
  await assert.rejects(compose(request(unlocked, 'Delete the first feature item.'), async (input) => {
    if (++calls === 2) throw new Error('Synthetic failure');
    return demoEvaluate(input);
  }), /Synthetic failure/);
  assert.deepEqual(unlocked, before);
});

test('removed copy fields are excluded from exact quote destinations and cannot silently restore themselves', async () => {
  let spec = validateSpec(createSpec());
  spec = setPartRemoved(spec, { sectionId: 'hero' }, 'heading', true).page;
  const output = await compose(request(spec, 'Set the hero heading to "Hidden replacement".'), async (input) => {
    for (const question of Object.values(input.questions)) assert.ok(!Object.hasOwn(question.criteria, 'section_hero_title'));
    return demoEvaluate(input);
  });
  assert.equal(section(output.spec, 'hero').title, section(spec, 'hero').title);
  assert.deepEqual(section(output.spec, 'hero').removedParts, ['heading']);
});

test('maximum supported collections retain bounded deletion planning options', () => {
  const spec = createSpec();
  spec.sections = GROUPS.filter(group=>!['testimonials','team','logos','stats'].includes(group)).map((group) => makeSection(group));
  for (const owner of spec.sections) if (owner.items.length) while (owner.items.length < 8) owner.items.push({ ...structuredClone(owner.items[0]), id: `${owner.group}-extra-${owner.items.length}` });
  const page = getPageSpec(validateSpec(spec));
  const plan = canvasPlanning(request(page, 'Delete selected elements.'));
  assert.ok(Object.keys(plan.targets).length < 255);
  assert.ok(Object.values(plan.questions).every((question) => Object.keys(question.criteria).length <= 255));
});

import { PNG_IMAGE } from './fixtures/images.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpec, makeSection, newItemId } from '../shared/content.mjs';
import { validateSpec } from '../shared/schema.mjs';
import { itemIconName } from '../shared/icons.mjs';
import { applyMove, canMove, moveSection, moveItem, moveOptions, placePart, validateMoveProposal, libraryOptions } from '../shared/structure.mjs';

const section = (page, group) => page.sections.find((entry) => entry.group === group);
const pageWith = (group, block) => {
  const page = validateSpec(createSpec());
  const replacement = makeSection(group, block);
  const index = page.sections.findIndex((entry) => entry.group === group);
  if (index < 0) page.sections.splice(page.sections.length - 1, 0, replacement);
  else page.sections[index] = replacement;
  return validateSpec(page);
};

test('legacy item identities migrate deterministically without collisions or input mutation', () => {
  const legacy = createSpec(), features = section(legacy, 'features');
  for (const item of features.items) delete item.id;
  features.items[1].id = 'item-1';
  delete features.items[0].art;
  delete features.items[0].placements;
  const before = structuredClone(legacy), first = validateSpec(legacy), second = validateSpec(legacy);
  assert.deepEqual(first, second);
  assert.deepEqual(legacy, before);
  assert.deepEqual(section(first, 'features').items.map((item) => item.id), ['item-2', 'item-1', 'item-3']);
  assert.deepEqual(validateSpec(first), first);
  assert.equal(section(first, 'features').items[0].art, 0);
});

test('new prepared items have fresh identifiers and duplicate or malformed saved identities fail', () => {
  assert.notEqual(newItemId(), newItemId());
  const one = makeSection('features'), two = makeSection('features');
  assert.equal(new Set([...one.items, ...two.items].map((item) => item.id)).size, 6);
  for (const identity of ['', 'a'.repeat(81), '<script>', null]) {
    const page = createSpec(); section(page, 'features').items[0].id = identity;
    assert.throws(() => validateSpec(page), /identifier/);
  }
  const duplicate = createSpec(), items = section(duplicate, 'features').items;
  items[1].id = items[0].id;
  assert.throws(() => validateSpec(duplicate), /unique/);
});

test('section insertions resolve after removal and preserve identity, content and links', () => {
  const page = validateSpec(createSpec()), before = structuredClone(page);
  page.brand.href = '#gallery'; before.brand.href = '#gallery';
  const result = moveSection(page, 'features', 'process');
  assert.equal(result.changed, true);
  assert.deepEqual(result.page.sections.map((entry) => entry.id), ['navigation', 'hero', 'gallery', 'services', 'features', 'process', 'faq', 'contact', 'footer']);
  assert.deepEqual(result.selection, { pageId: 'home', sectionId: 'features' });
  assert.strictEqual(section(result.page, 'features'), section(page, 'features'));
  assert.equal(result.page.brand.href, '#gallery');
  assert.deepEqual(page, before);
  assert.deepEqual(moveSection(result.page, 'features', 'gallery').page.sections.map((entry) => entry.id), page.sections.map((entry) => entry.id));
});

test('fixed anchors and locked barriers reject moves without changing the page', () => {
  const page = validateSpec(createSpec());
  for (const [source, target] of [['hero', 'gallery'], ['navigation', null], ['footer', 'features'], ['features', 'hero'], ['features', null]]) {
    const result = moveSection(page, source, target);
    assert.equal(result.allowed, false);
    assert.strictEqual(result.page, page);
  }
  section(page, 'services').locked = true;
  assert.equal(moveSection(page, 'features', 'process').allowed, false);
  assert.equal(moveSection(page, 'services', 'features').allowed, false);
  assert.equal(moveSection(page, 'gallery', 'features').allowed, true);
  section(page, 'features').locked = true;
  const item = section(page, 'features').items[0];
  assert.equal(moveItem(page, 'features', item.id, null).allowed, false);
  assert.equal(placePart(page, { sectionId: 'features', itemId: item.id }, 'icon', 'feature-icon', 'beside').allowed, false);
});

test('current-position section, item and effective part moves are reference-preserving noops', () => {
  const page = validateSpec(createSpec()), items = section(page, 'features').items;
  for (const result of [moveSection(page, 'features', 'features'), moveSection(page, 'features', 'gallery'), moveItem(page, 'features', items[0].id, items[0].id), moveItem(page, 'features', items[0].id, items[1].id), placePart(page, { sectionId: 'hero' }, 'heading', 'content', 'body'), placePart(page, { sectionId: 'hero' }, 'heading', 'content', 'heading')]) {
    assert.equal(result.allowed, true);
    assert.equal(result.changed, false);
    assert.strictEqual(result.page, page);
  }
});

test('every repeated family reorders within its collection and keeps all saved item fields', () => {
  for (const group of ['features', 'gallery', 'services', 'process', 'pricing', 'faq']) {
    const page = pageWith(group), original = section(page, group).items;
    original[0].href = 'https://example.com/details';
    const result = moveItem(page, group, original[0].id, null), moved = section(result.page, group).items;
    assert.equal(result.changed, true, group);
    assert.deepEqual(moved.map((item) => item.id), [original[1].id, original[2].id, original[0].id]);
    assert.equal(moved[2].title, original[0].title);
    assert.equal(moved[2].href, original[0].href);
    assert.equal(result.selection.itemId, original[0].id);
    assert.equal(section(page, group).items[0].id, original[0].id);
  }
});

test('effective feature glyphs and gallery artwork remain attached to the moved identities', () => {
  for (const group of ['features', 'gallery']) {
    const page = pageWith(group), original = section(page, group).items;
    const visuals = new Map(original.map((item, index) => [item.id, { icon: itemIconName(item, index), art: item.art }]));
    const first = moveItem(page, group, original[0].id, null).page;
    const nextItems = section(first, group).items;
    const second = moveItem(first, group, nextItems[1].id, nextItems[0].id).page;
    section(second, group).items.forEach((item, index) => {
      if (group === 'features') assert.equal(itemIconName(item, index), visuals.get(item.id).icon);
      assert.equal(item.art, visuals.get(item.id).art);
    });
  }
});

test('pricing migration and reorder follow the highlighted plan identity', () => {
  const page = pageWith('pricing', 'pricing-featured'), pricing = section(page, 'pricing');
  delete pricing.featuredItemId;
  const legacy = validateSpec(page), featured = section(legacy, 'pricing').items[1].id;
  assert.equal(section(legacy, 'pricing').featuredItemId, featured);
  const moved = moveItem(legacy, 'pricing', featured, section(legacy, 'pricing').items[0].id).page;
  assert.equal(section(moved, 'pricing').featuredItemId, featured);
  assert.equal(section(moved, 'pricing').elements.featuredItem, 'first');
  assert.equal(section(validateSpec(moved), 'pricing').featuredItemId, featured);
  const invalid = structuredClone(moved); section(invalid, 'pricing').featuredItemId = 'missing';
  assert.throws(() => validateSpec(invalid), /highlighted plan/);
});

test('move proposals reject wrong pages, unknown IDs, foreign parents, excess items and unbounded fields', () => {
  const page = validateSpec(createSpec()), features = section(page, 'features');
  const valid = { kind: 'item', pageId: 'home', sectionId: 'features', itemId: features.items[0].id, beforeItemId: null };
  for (const patch of [{ pageId: 'other' }, { sectionId: 'missing' }, { itemId: 'missing' }, { beforeItemId: section(page, 'gallery').items[0].id }, { html: '<b>no</b>' }, { destinationSectionId: 'gallery' }, { itemId: 'x'.repeat(81) }, { beforeItemId: undefined }]) {
    const result = applyMove(page, { ...valid, ...patch });
    assert.equal(result.allowed, false);
    assert.strictEqual(result.page, page);
  }
  assert.throws(() => validateMoveProposal({ ...valid, kind: '__proto__' }));
  assert.equal(applyMove(page, { ...valid, pageId: 'about' }, 'about').allowed, true);
  features.items = Array.from({ length: 9 }, (_, index) => ({ ...features.items[0], id: `item-${index}` }));
  assert.equal(applyMove(page, valid).allowed, false);
});

test('authored part locations persist on the owner and reject unsupported nesting', () => {
  const page = validateSpec(createSpec()), firstId = section(page, 'features').items[0].id;
  const action = placePart(page, { sectionId: 'hero' }, 'action', 'content', 'body');
  assert.equal(section(action.page, 'hero').elements.contentOrder, 'heading-action-body');
  const icon = placePart(page, { sectionId: 'features', itemId: firstId }, 'icon', 'feature-icon', 'beside');
  assert.equal(section(icon.page, 'features').items[0].placements.iconPlacement, 'beside');
  assert.equal(section(icon.page, 'features').items[1].placements.iconPlacement, 'default');
  const text = placePart(page, { sectionId: 'features', itemId: firstId }, 'body', 'text', 'heading');
  assert.equal(section(text.page, 'features').items[0].placements.textOrder, 'body-heading');
  assert.deepEqual(validateSpec(text.page), text.page);
  for (const [part, slot, before] of [['heading', 'content', 'missing'], ['action', 'button-icon', 'leading'], ['icon', 'content', 'heading']]) assert.equal(placePart(page, { sectionId: 'hero' }, part, slot, before).allowed, false);
  const invalid = structuredClone(page); section(invalid, 'features').items[0].placements.children = [];
  assert.throws(() => validateSpec(invalid), /placement/);
});

test('Move menus emit allowed semantic operations and exclude noops and locked destinations', () => {
  const page = validateSpec(createSpec()), selection = { pageId: 'home', sectionId: 'features' };
  section(page, 'services').locked = true;
  const options = moveOptions(page, selection);
  assert.ok(options.length);
  for (const option of options) {
    assert.equal(typeof option.label, 'string');
    assert.deepEqual(canMove(page, option.proposal), { allowed: true, reason: null, changed: true });
  }
  const itemOptions = moveOptions(page, { ...selection, itemId: section(page, 'features').items[0].id });
  assert.ok(itemOptions.some((option) => option.label.includes('last')));
  const partOptions = moveOptions(page, { pageId: 'home', sectionId: 'hero', partKey: 'action' });
  assert.ok(partOptions.some((option) => option.proposal.beforePartKey === 'body'));
  assert.deepEqual(moveOptions(page, { pageId: 'home', sectionId: 'services' }), []);
});

test('translated move and library labels preserve proposals and interpolate authored titles literally', () => {
  const page = validateSpec(createSpec()), before = structuredClone(page);
  const features = section(page, 'features');
  const title = 'Literal {part} <b>name</b>';
  features.items[0].title = title;
  before.sections.find((entry) => entry.id === features.id).items[0].title = title;
  const translatedKeys = [];
  const translate = (message, params = {}) => {
    translatedKeys.push(message);
    return `Translated: ${message.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(params, key) ? String(params[key]) : match)}`;
  };
  const references = [
    { pageId: 'home', sectionId: 'features' },
    { pageId: 'home', sectionId: 'features', itemId: features.items[0].id },
    { pageId: 'home', sectionId: 'hero', partKey: 'action' }
  ];
  for (const selection of references) {
    const original = moveOptions(page, selection), translated = moveOptions(page, selection, translate);
    assert.deepEqual(translated.map((entry) => entry.proposal), original.map((entry) => entry.proposal));
    assert.ok(translated.length && translated.every((entry) => entry.label.startsWith('Translated: ')));
    if (selection.itemId) assert.ok(translated.every((entry) => entry.label.includes(title)));
  }
  for (const entry of [{ kind: 'section', blockId: 'features-list' }, { kind: 'icon', icon: 'leaf', slot: 'feature-icon' }]) {
    const original = libraryOptions(page, entry), translated = libraryOptions(page, entry, 'home', translate);
    assert.deepEqual(translated.map((choice) => choice.proposal), original.map((choice) => choice.proposal));
    assert.ok(translated.length && translated.every((choice) => choice.label.startsWith('Translated: ')));
    if (entry.kind === 'icon') assert.ok(translated.some((choice) => choice.label.includes(title)));
  }
  assert.equal(translatedKeys.includes(title), false);
  assert.deepEqual(page, before);
});

test('plain text items transfer losslessly between services and process with stable identity', () => {
  for (const [sourceGroup, targetGroup] of [['services', 'process'], ['process', 'services']]) {
    const page = validateSpec(createSpec()), source = section(page, sourceGroup), target = section(page, targetGroup);
    source.elements.textOrder = 'body-heading';
    const item = source.items[0], before = structuredClone(page);
    item.href = '#contact'; before.sections.find((entry) => entry.id === source.id).items[0].href = '#contact';
    const proposal = { kind: 'transfer-item', pageId: 'home', sectionId: source.id, itemId: item.id, targetSectionId: target.id, beforeItemId: target.items[1].id };
    const result = applyMove(page, proposal);
    assert.equal(result.allowed, true);
    assert.equal(result.changed, true);
    assert.deepEqual(result.selection, { pageId: 'home', sectionId: target.id, itemId: item.id });
    assert.ok(!section(result.page, sourceGroup).items.some((entry) => entry.id === item.id));
    const transferred = section(result.page, targetGroup).items[1];
    assert.equal(transferred.id, item.id);
    assert.equal(transferred.title, item.title);
    assert.equal(transferred.body, item.body);
    assert.equal(transferred.href, '#contact');
    assert.equal(transferred.art, item.art);
    assert.equal(transferred.placements.textOrder, 'body-heading');
    assert.deepEqual(page, before);
    assert.deepEqual(validateSpec(result.page), result.page);
  }
});

test('item transfers reject incompatible content, locks, collisions, wrong pages and capacity atomically', () => {
  const original = validateSpec(createSpec());
  const base = { kind: 'transfer-item', pageId: 'home', sectionId: 'services', itemId: section(original, 'services').items[0].id, targetSectionId: 'process', beforeItemId: null };
  for (const mutate of [
    (page) => { section(page, 'services').locked = true; },
    (page) => { section(page, 'process').locked = true; },
    (page) => { section(page, 'services').items[0].price = '€50'; },
    (page) => { section(page, 'services').items[0].meta = 'Caption'; },
    (page) => { section(page, 'services').items[0].image = PNG_IMAGE; },
    (page) => { section(page, 'services').items[0].alt = 'Stored alternative text'; },
    (page) => { section(page, 'services').items[0].icon = 'leaf'; },
    (page) => { section(page, 'services').items[0].buttonIcon = 'mail'; },
    (page) => { section(page, 'process').items[0].id = base.itemId; },
    (page) => { section(page, 'process').items = Array.from({ length: 8 }, (_, index) => ({ ...section(page, 'process').items[0], id: `target-${index}` })); }
  ]) {
    const page = structuredClone(original); mutate(page); const before = structuredClone(page);
    const result = applyMove(page, base);
    assert.equal(result.allowed, false);
    assert.strictEqual(result.page, page);
    assert.deepEqual(page, before);
  }
  for (const patch of [{ targetSectionId: 'features' }, { targetSectionId: 'services' }, { targetSectionId: 'missing' }, { pageId: 'other' }, { beforeItemId: section(original, 'features').items[0].id }, { destinationHtml: '<p>no</p>' }]) assert.equal(applyMove(original, { ...base, ...patch }).allowed, false);
});

test('transfer menu choices explicitly name the compatible destination and apply through the common operation', () => {
  const page = validateSpec(createSpec()), source = section(page, 'services');
  const options = moveOptions(page, { pageId: 'home', sectionId: source.id, itemId: source.items[0].id }).filter(({ proposal }) => proposal.kind === 'transfer-item');
  assert.ok(options.length);
  assert.ok(options.every(({ label, proposal }) => label.includes('Process') && proposal.targetSectionId === 'process' && canMove(page, proposal).allowed));
  source.items[0].price = 'Ask for a quote';
  assert.ok(!moveOptions(page, { pageId: 'home', sectionId: source.id, itemId: source.items[0].id }).some(({ proposal }) => proposal.kind === 'transfer-item'));
});

test('library insertion adds prepared repeatable components and destination evaluation never generates IDs', () => {
  const page = validateSpec(createSpec()), before = structuredClone(page);
  const entry = { kind: 'section', blockId: 'about-split' };
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  let options;
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { randomUUID() { throw new Error('Destination evaluation allocated an identity.'); } } });
  try {
    options = libraryOptions(page, entry);
    assert.ok(options.length);
    for (const { proposal } of options) assert.equal(canMove(page, proposal).allowed, true);
  } finally { Object.defineProperty(globalThis, 'crypto', cryptoDescriptor); }
  const choice = options.find(({ proposal }) => proposal.beforeSectionId === 'gallery');
  const result = applyMove(page, choice.proposal);
  assert.equal(result.changed, true);
  assert.equal(result.page.sections.findIndex((entry) => entry.group === 'about') + 1, result.page.sections.findIndex((entry) => entry.group === 'gallery'));
  assert.equal(section(result.page, 'about').draft, true);
  assert.deepEqual(result.selection, { pageId: 'home', sectionId: 'about' });
  const repeated = applyMove(result.page, choice.proposal); assert.equal(repeated.allowed, true); assert.notEqual(repeated.selection.sectionId, result.selection.sectionId);
  assert.deepEqual(page, before);
  assert.deepEqual(validateSpec(result.page), result.page);
});

test('library insertion preserves fixed order and locked structural slots', () => {
  const page = validateSpec(createSpec());
  section(page, 'services').locked = true;
  const proposal = { kind: 'insert-section', pageId: 'home', blockId: 'about-split', beforeSectionId: 'gallery' };
  assert.equal(applyMove(page, proposal).allowed, false);
  assert.equal(applyMove(page, { ...proposal, beforeSectionId: 'process' }).allowed, true);
  assert.equal(applyMove(page, { ...proposal, beforeSectionId: 'hero' }).allowed, false);
  assert.equal(applyMove(page, { ...proposal, beforeSectionId: null }).allowed, false);
  assert.equal(applyMove(page, { ...proposal, blockId: '__proto__' }).allowed, false);
  assert.equal(applyMove(page, { ...proposal, blockId: 'features-list' }).allowed, false);
  assert.equal(applyMove(page, { ...proposal, beforeSectionId: 'missing' }).allowed, false);
  assert.equal(applyMove(page, { ...proposal, pageId: 'other' }).allowed, false);
});

test('library section replacement is explicit, same-family, immutable and preserves saved content', () => {
  const page = validateSpec(createSpec()), original = section(page, 'features');
  const replacement = original.block === 'features-list' ? 'features-cards' : 'features-list';
  const choices = libraryOptions(page, { kind: 'section', blockId: replacement });
  assert.equal(choices.filter(choice=>choice.proposal.kind==='replace-section').length, 1);
  assert.ok(choices.some(choice=>choice.proposal.kind==='insert-section'));
  assert.match(choices[0].label, /Replace.*keep its content/);
  const result = applyMove(page, choices[0].proposal);
  assert.equal(section(result.page, 'features').block, replacement);
  assert.deepEqual(section(result.page, 'features').items, original.items);
  assert.equal(section(result.page, 'features').title, original.title);
  const noop = applyMove(result.page, choices[0].proposal);
  assert.equal(noop.changed, false); assert.strictEqual(noop.page, result.page);
  assert.equal(applyMove(page, { ...choices[0].proposal, blockId: 'about-split' }).allowed, false);
  original.locked = true;
  assert.equal(applyMove(page, choices[0].proposal).allowed, false);
});

test('library feature and button icons replace only their explicit authored owner', () => {
  const page = pageWith('pricing', 'pricing-featured'), features = section(page, 'features'), pricing = section(page, 'pricing');
  const feature = libraryOptions(page, { kind: 'icon', slot: 'feature-icon', icon: 'leaf' }).find(({ proposal }) => proposal.itemId === features.items[0].id);
  const featureResult = applyMove(page, feature.proposal);
  assert.equal(section(featureResult.page, 'features').items[0].icon, 'leaf');
  assert.equal(section(featureResult.page, 'features').items[1].icon, features.items[1].icon);
  const buttons = libraryOptions(page, { kind: 'icon', slot: 'button-icon', icon: 'mail' });
  const plan = buttons.find(({ proposal }) => proposal.itemId === pricing.items[1].id);
  assert.ok(plan);
  const planResult = applyMove(page, plan.proposal);
  assert.equal(section(planResult.page, 'pricing').items[1].buttonIcon, 'mail');
  assert.equal(section(planResult.page, 'pricing').items[0].buttonIcon, 'default');
  assert.equal(section(planResult.page, 'pricing').elements.buttonIcon, pricing.elements.buttonIcon);
  assert.deepEqual(validateSpec(planResult.page), planResult.page);
  const hero = buttons.find(({ proposal }) => proposal.sectionId === 'hero');
  assert.equal(section(applyMove(page, hero.proposal).page, 'hero').elements.buttonIcon, 'mail');
  for (const patch of [{ icon: '__proto__' }, { icon: '<svg>' }, { itemId: 'missing' }, { slot: 'html' }, { sectionId: 'process', itemId: section(page, 'process').items[0].id }, { pageId: 'other' }, { css: 'position:fixed' }]) assert.equal(applyMove(page, { ...plan.proposal, ...patch }).allowed, false);
  assert.deepEqual(libraryOptions(page, { kind: 'icon', slot: 'button-icon', icon: 'mail', html: '<svg>' }), []);
});

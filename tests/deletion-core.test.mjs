import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpec, makeSection } from '../shared/content.mjs';
import { validateSpec, validateCompose, validateRemovedParts } from '../shared/schema.mjs';
import { createPage, removeSection, clearSectionReferences } from '../shared/pages.mjs';
import { partsFor, isPartVisible, PART_LABELS } from '../shared/parts.mjs';
import { removeItem, setPartRemoved, applyMove, moveSection, placePart, libraryOptions } from '../shared/structure.mjs';
import { slotsFor } from '../shared/slots.mjs';
import { itemIconName } from '../shared/icons.mjs';

const find = (page, id) => page.sections.find((section) => section.id === id);
const fresh = () => validateSpec(createSpec());

test('legacy removals normalize without mutation and reject unbounded part keys', () => {
  const legacy = createSpec(), before = structuredClone(legacy);
  const normalized = validateSpec(legacy);
  for (const section of normalized.sections) {
    assert.deepEqual(section.removedParts, []);
    for (const item of section.items) assert.deepEqual(item.removedParts, []);
  }
  assert.deepEqual(legacy, before);
  assert.deepEqual(validateSpec(normalized), normalized);
  for (const value of [null, {}, '', ['heading', 'heading'], ['script'], ['__proto__'], ['<svg>'], [1]]) assert.throws(() => validateRemovedParts(value), /Removed parts/);
  assert.deepEqual(validateRemovedParts(Object.keys(PART_LABELS)), Object.keys(PART_LABELS));
});

test('all sections including navigation and hero can be deleted down to a valid empty page', () => {
  const original = fresh(), before = structuredClone(original);
  let result = original;
  for (const id of ['navigation', 'hero', ...original.sections.filter((section) => !['navigation', 'hero'].includes(section.id)).map((section) => section.id)]) result = validateSpec(removeSection(result, 'home', id));
  assert.deepEqual(result.sections, []);
  assert.deepEqual(original, before);
  assert.throws(() => removeSection(result, 'home', 'hero'), /no longer exists/);
  const inserted = applyMove(result, { kind: 'insert-section', pageId: 'home', blockId: 'features-cards', beforeSectionId: null });
  assert.equal(inserted.allowed, true);
  assert.deepEqual(validateSpec(inserted.page).sections.map((section) => section.group), ['features']);
});

test('navigation and hero ordering rules remain conditional after deleting fixed sections', () => {
  let page = removeSection(removeSection(fresh(), 'home', 'navigation'), 'home', 'hero');
  assert.equal(moveSection(page, 'gallery', 'features').allowed, true);
  assert.equal(applyMove(page, { kind: 'insert-section', pageId: 'home', blockId: 'hero-split', beforeSectionId: 'features' }).allowed, true);
  assert.equal(applyMove(page, { kind: 'insert-section', pageId: 'home', blockId: 'hero-split', beforeSectionId: 'gallery' }).allowed, false);
  assert.equal(applyMove(page, { kind: 'insert-section', pageId: 'home', blockId: 'nav-minimal', beforeSectionId: 'gallery' }).allowed, false);
});

test('section deletion repairs incoming site links while preserving unrelated destinations', () => {
  const site = fresh();
  site.pages.push(createPage(site, { id: 'details', title: 'Details', slug: 'details', template: 'contact' }));
  site.brand.href = 'page:details#contact';
  find(site, 'hero').href = 'page:details#contact';
  find(site, 'features').items[0].href = 'page:details#contact';
  find(site, 'features').items[1].href = '#contact';
  find(site.pages[0], 'hero').href = '#contact';
  const before = structuredClone(site), result = removeSection(site, 'details', 'contact');
  assert.equal(result.brand.href, 'page:details');
  assert.equal(find(result, 'hero').href, 'page:details');
  assert.equal(find(result, 'features').items[0].href, 'page:details');
  assert.equal(find(result, 'features').items[1].href, '#contact');
  assert.equal(find(result.pages[0], 'hero').href, '');
  assert.deepEqual(site, before);
  assert.doesNotThrow(() => validateSpec(result));
  assert.deepEqual(clearSectionReferences(result, 'details', 'contact'), result);
});

test('bare shared brand fragments are Home scoped and deleting locked sections is atomic', () => {
  const site = fresh();
  site.pages.push(createPage(site, { id: 'details', title: 'Details', slug: 'details', template: 'contact' }));
  site.brand.href = '#contact';
  assert.equal(removeSection(site, 'details', 'contact').brand.href, '#contact');
  assert.equal(removeSection(site, 'home', 'contact').brand.href, '');
  find(site, 'hero').locked = true;
  const before = structuredClone(site);
  assert.throws(() => removeSection(site, 'home', 'hero'), /Unlock/);
  assert.deepEqual(site, before);
});

test('part removal persists on the exact owner and supports restoration without destroying copy', () => {
  const page = fresh(), feature = find(page, 'features'), item = feature.items[0];
  const removed = setPartRemoved(page, { sectionId: feature.id, itemId: item.id }, 'heading');
  assert.equal(removed.allowed, true);
  assert.equal(removed.changed, true);
  const owner = find(removed.page, 'features').items[0];
  assert.equal(owner.title, item.title);
  assert.equal(isPartVisible(owner, 'heading'), false);
  assert.equal(isPartVisible(find(removed.page, 'features').items[1], 'heading'), true);
  assert(partsFor(feature, item.id).some((entry) => entry.partKey === 'heading'));
  assert.deepEqual(validateSpec(removed.page), removed.page);
  const noChange = setPartRemoved(removed.page, { sectionId: feature.id, itemId: item.id }, 'heading');
  assert.equal(noChange.changed, false);
  assert.strictEqual(noChange.page, removed.page);
  const restored = setPartRemoved(removed.page, { sectionId: feature.id, itemId: item.id }, 'heading', false);
  assert.deepEqual(restored.page, page);
});

test('removed movable parts disappear from move choices without invalidating saved order', () => {
  const page = setPartRemoved(fresh(), { sectionId: 'hero' }, 'heading').page;
  const hero = find(page, 'hero');
  assert(!slotsFor(hero).some((part) => part.partKey === 'heading'));
  assert(slotsFor(hero).every((part) => !part.required && part.choices.every((choice) => choice.beforePartKey !== 'heading')));
  assert.equal(placePart(page, { sectionId: 'hero' }, 'heading', 'content', null).allowed, false);
  const moved = placePart(page, { sectionId: 'hero' }, 'body', 'content', null);
  assert.equal(moved.allowed, true);
  assert.doesNotThrow(() => validateSpec(moved.page));
});

test('part deletions reject stale owners, unsupported parts and locked sections atomically', () => {
  const page = fresh();
  for (const [owner, key, removed] of [[{ sectionId: 'missing' }, 'heading', true], [{ sectionId: 'hero', itemId: 'missing' }, 'body', true], [{ sectionId: 'hero' }, 'control', true], [{ sectionId: 'hero', extra: 'bad' }, 'body', true], [{ sectionId: 'hero' }, 'body', 'true']]) {
    const result = setPartRemoved(page, owner, key, removed);
    assert.equal(result.allowed, false);
    assert.strictEqual(result.page, page);
  }
  find(page, 'hero').locked = true;
  assert.equal(setPartRemoved(page, { sectionId: 'hero' }, 'body').allowed, false);
});

test('deleting items preserves sibling visuals and permits empty collections', () => {
  let page = fresh();
  const items = find(page, 'features').items, icons = items.map(itemIconName);
  const result = removeItem(page, 'features', items[0].id);
  assert.equal(result.allowed, true);
  assert.deepEqual(find(result.page, 'features').items.map(itemIconName), icons.slice(1));
  assert.deepEqual(find(result.page, 'features').items.map((item) => item.art), [1, 2]);
  page = result.page;
  for (const item of find(page, 'features').items) page = removeItem(page, 'features', item.id).page;
  assert.deepEqual(find(validateSpec(page), 'features').items, []);
  assert.equal(removeItem(page, 'features', items[0].id).allowed, false);
});

test('deleting a pricing plan retains highlight identity or clears the removed highlight', () => {
  const page = fresh();
  page.sections.splice(page.sections.length - 1, 0, makeSection('pricing', 'pricing-featured'));
  const normalized = validateSpec(page), pricing = find(normalized, 'pricing'), highlighted = pricing.items[1].id;
  const deletedFirst = removeItem(normalized, 'pricing', pricing.items[0].id).page;
  assert.equal(find(deletedFirst, 'pricing').featuredItemId, highlighted);
  assert.equal(find(deletedFirst, 'pricing').elements.featuredItem, 'first');
  const deletedHighlight = removeItem(deletedFirst, 'pricing', highlighted).page;
  assert.equal(find(deletedHighlight, 'pricing').featuredItemId, null);
  assert.equal(find(deletedHighlight, 'pricing').elements.featuredItem, 'none');
  assert.doesNotThrow(() => validateSpec(deletedHighlight));
});

test('interface fields and nested controls support the same owner-scoped removal contract', () => {
  const page = fresh(); page.sections = [makeSection('hero', 'app-login')];
  const normalized = validateSpec(page), hero = find(normalized, 'hero'), item = hero.items[0];
  assert(partsFor(hero).some((part) => part.partKey === 'form'));
  assert(partsFor(hero, item.id).some((part) => part.partKey === 'control'));
  const result = setPartRemoved(normalized, { sectionId: 'hero', itemId: item.id }, 'control');
  assert.equal(result.allowed, true);
  assert.equal(isPartVisible(find(result.page, 'hero').items[0], 'control'), false);
  let removed = normalized;
  for (const field of hero.items) removed = removeItem(removed, 'hero', field.id).page;
  assert.deepEqual(validateSpec(removed).sections[0].items, []);
  hero.locked = true;
  assert.equal(removeItem(normalized, 'hero', item.id).allowed, false);
});

test('compose context accepts visible removable parts and rejects removed or stale parts', () => {
  const spec = fresh(), raw = { mode: 'demo', operation: 'edit', prompt: 'Change the eyebrow', spec, selectedSectionId: 'hero', selectedPartKey: 'eyebrow' };
  assert.equal(validateCompose(raw).selectedPartKey, 'eyebrow');
  raw.spec = setPartRemoved(spec, { sectionId: 'hero' }, 'eyebrow').page;
  assert.throws(() => validateCompose(raw), /selected element/);
});

test('explicit library replacement restores only the chosen icon even when its saved glyph is unchanged', () => {
  const page = fresh();
  page.sections.splice(page.sections.length - 1, 0, makeSection('pricing', 'pricing-featured'));
  const normalized = validateSpec(page), feature = find(normalized, 'features').items[0], plan = find(normalized, 'pricing').items[0];
  feature.icon = 'leaf'; feature.removedParts = ['icon', 'body'];
  plan.buttonIcon = 'mail'; plan.removedParts = ['buttonIcon', 'buttonLabel'];
  const hero = find(normalized, 'hero'); hero.elements.buttonIcon = 'mail'; hero.removedParts = ['buttonIcon', 'eyebrow'];
  for (const [slot, glyph, sectionId, itemId, remaining] of [['feature-icon', 'leaf', 'features', feature.id, ['body']], ['button-icon', 'mail', 'pricing', plan.id, ['buttonLabel']], ['button-icon', 'mail', 'hero', undefined, ['eyebrow']]]) {
    const options = libraryOptions(normalized, { kind: 'icon', slot, icon: glyph });
    const choice = options.find(({ proposal }) => proposal.sectionId === sectionId && proposal.itemId === itemId);
    assert(choice, `${sectionId} deleted icon can be explicitly replaced`);
    const result = applyMove(normalized, choice.proposal);
    assert.equal(result.allowed, true); assert.equal(result.changed, true);
    const owner = itemId ? find(result.page, sectionId).items.find((item) => item.id === itemId) : find(result.page, sectionId);
    assert.deepEqual(owner.removedParts, remaining);
    assert.deepEqual(validateSpec(result.page), result.page);
  }
  assert.deepEqual(feature.removedParts, ['icon', 'body']);
  assert.deepEqual(hero.removedParts, ['buttonIcon', 'eyebrow']);
});

test('icon library omits deleted or hidden parent buttons and direct replacement cannot restore them', () => {
  const page = fresh();
  page.sections.splice(page.sections.length - 1, 0, makeSection('pricing', 'pricing-featured'));
  const normalized = validateSpec(page), hero = find(normalized, 'hero'), plan = find(normalized, 'pricing').items[0];
  hero.removedParts = ['action', 'buttonIcon']; plan.removedParts = ['action', 'buttonIcon'];
  let options = libraryOptions(normalized, { kind: 'icon', slot: 'button-icon', icon: 'mail' });
  assert(!options.some(({ proposal }) => proposal.sectionId === 'hero' || proposal.itemId === plan.id));
  assert(options.some(({ proposal }) => proposal.sectionId === 'pricing' && proposal.itemId !== plan.id));
  for (const proposal of [{ sectionId: 'hero' }, { sectionId: 'pricing', itemId: plan.id }]) {
    const result = applyMove(normalized, { kind: 'replace-icon', pageId: 'home', slot: 'button-icon', icon: 'mail', ...proposal });
    assert.equal(result.allowed, false); assert.strictEqual(result.page, normalized);
  }
  hero.removedParts = []; hero.elements.primaryAction = 'hide';
  find(normalized, 'contact').removedParts = ['form'];
  options = libraryOptions(normalized, { kind: 'icon', slot: 'button-icon', icon: 'mail' });
  assert(!options.some(({ proposal }) => ['hero', 'contact'].includes(proposal.sectionId)));
});

test('application removal registry matches field buttons, product actions and module labels', () => {
  const keys = (section, item) => partsFor(section, item.id).map((part) => part.partKey);
  for (const block of ['app-login', 'app-signup', 'app-settings', 'app-checkout']) {
    const section = makeSection('hero', block), item = section.items[0];
    item.uiType = 'action';
    assert.deepEqual(keys(section, item), ['action', 'buttonLabel', 'buttonIcon'], block);
    item.uiType = 'checkbox';
    assert.deepEqual(keys(section, item), ['heading', 'body', 'control'], block);
  }
  const storefront = makeSection('hero', 'app-storefront');
  assert(keys(storefront, storefront.items[0]).includes('action'));
  assert(keys(storefront, storefront.items[0]).includes('buttonIcon'));
  assert(!keys(storefront, storefront.items[0]).includes('buttonLabel'));
  const checkout = makeSection('hero', 'app-checkout'), product = checkout.items.find((item) => item.uiType === 'product');
  assert.deepEqual(keys(checkout, product), ['heading', 'body', 'meta', 'price', 'media']);
  const workspace = makeSection('hero', 'app-workspace'), item = workspace.items[0];
  for (const type of ['action', 'form']) {
    item.uiType = type;
    assert(!keys(workspace, item).includes('meta'), type);
    assert(keys(workspace, item).includes('buttonLabel'), type);
  }
  item.uiType = 'list'; item.price = '';
  assert(!keys(workspace, item).includes('price'));
  item.price = '20';
  assert(keys(workspace, item).includes('price'));
});

test('chat suggestion removal applies to the rendered first four items and retains restore choices', () => {
  const section = makeSection('hero', 'app-chat');
  while (section.items.length < 5) section.items.push({ ...section.items[0], id: `chat-extra-${section.items.length}` });
  section.items[0].removedParts = ['action', 'buttonIcon'];
  for (const key of ['heading', 'body', 'meta', 'icon', 'action', 'buttonLabel', 'buttonIcon']) assert(partsFor(section, section.items[0].id).some((part) => part.partKey === key));
  assert(!partsFor(section, section.items[4].id).some((part) => part.partKey === 'action'));
  assert(partsFor(section, section.items[4].id).some((part) => part.partKey === 'heading'));
});

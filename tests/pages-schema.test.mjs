import test from 'node:test';
import assert from 'node:assert/strict';
import { paddedPng } from './fixtures/images.mjs';
import { createSpec } from '../shared/content.mjs';
import { validateSpec, validateCompose, safeHref } from '../shared/schema.mjs';
import { PAGE_TEMPLATES, createPage, getPageSpec, replacePageSpec, removePage, pageFilename, parsePageHref } from '../shared/pages.mjs';

function siteWithPages() {
  const site = createSpec();
  site.pages.push(createPage(site, { id: 'journal', title: 'Journal', slug: 'journal', template: 'blog' }));
  site.pages.push(createPage(site, { id: 'story', title: 'First story', slug: 'first-story', template: 'article', showInNav: false }));
  site.pages[0].sections.find((section) => section.group === 'gallery').items[0].href = 'page:story';
  return validateSpec(site);
}

test('version-one single-page projects migrate without changing existing page data', () => {
  const legacy = createSpec(); delete legacy.pages;
  for (const section of legacy.sections) for (const item of section.items) delete item.href;
  const snapshot = structuredClone(legacy), result = validateSpec(legacy);
  assert.deepEqual(result.pages, []);
  assert.equal(result.sections[3].items[0].href, '');
  assert.deepEqual(legacy, snapshot);
  assert.deepEqual(validateSpec(result), result);
});

test('page templates have independent data and preserve prepared draft attribution', () => {
  const site = siteWithPages();
  site.pages[0].theme.palette = 'midnight';
  assert.equal(site.theme.palette, 'porcelain');
  assert.equal(site.pages[1].theme.palette, 'porcelain');
  assert.ok(site.pages.every((page) => page.sections.every((section) => section.draft)));
  assert.equal(site.pages[1].sections.find((section) => section.group === 'about').block, 'about-statement');
  const page = createPage(site, { id: 'other', title: 'Other', slug: 'other', sourcePageId: 'journal' });
  assert.equal(page.theme.palette, 'midnight');
  assert.throws(() => createPage(site, { template: '__proto__' }), /Unknown/);
});

test('every page starter creates a valid independent page with its intended sections', () => {
  const expectedGroups = {
    general: ['navigation', 'hero', 'footer'],
    about: ['navigation', 'hero', 'about', 'process', 'cta', 'footer'],
    services: ['navigation', 'hero', 'services', 'process', 'faq', 'contact', 'footer'],
    portfolio: ['navigation', 'hero', 'gallery', 'about', 'contact', 'footer'],
    pricing: ['navigation', 'hero', 'pricing', 'faq', 'contact', 'footer'],
    faq: ['navigation', 'hero', 'faq', 'contact', 'footer'],
    contact: ['navigation', 'hero', 'contact', 'footer'],
    blog: ['navigation', 'hero', 'gallery', 'footer'],
    article: ['navigation', 'hero', 'about', 'footer']
  };
  assert.deepEqual(Object.keys(PAGE_TEMPLATES).sort(), Object.keys(expectedGroups).sort());
  assert.equal(PAGE_TEMPLATES.general.label, 'Custom page');
  for (const [template, details] of Object.entries(PAGE_TEMPLATES)) {
    const site = createSpec(), before = structuredClone(site);
    const options = { id: `test-${template}`, title: details.title, slug: details.slug, template, showInNav: template !== 'article' };
    const originalOptions = structuredClone(options);
    const page = createPage(site, options);
    assert.deepEqual(site, before, `${template} must not mutate the source site`);
    assert.deepEqual(options, originalOptions, `${template} must not mutate its options`);
    assert.deepEqual(page.sections.map((section) => section.group), expectedGroups[template]);
    assert.equal(page.title, details.title);
    assert.equal(page.sections[1].title, details.title);
    assert.ok(page.sections[1].body.length > 0);
    assert.ok(page.sections.every((section) => section.draft && !section.locked));
    if (page.sections[1].href) assert.ok(page.sections.some((section) => `#${section.id}` === page.sections[1].href));
    site.pages.push(page);
    const validated = validateSpec(site);
    assert.deepEqual(validated.pages[0], page, `${template} must survive validation unchanged`);
    assert.equal(getPageSpec(validated, page.id).brand, validated.brand, `${template} uses the shared project brand`);
  }
});

test('page starters copy the selected theme without sharing editable data between pages', () => {
  const site = siteWithPages();
  site.pages[0].theme.palette = 'sage';
  site.pages[0].theme.width = 'focused';
  const first = createPage(site, { id: 'services-one', title: 'Services one', slug: 'services-one', template: 'services', sourcePageId: 'journal' });
  const second = createPage(site, { id: 'services-two', title: 'Services two', slug: 'services-two', template: 'services', sourcePageId: 'journal' });
  const before = structuredClone(site), secondBefore = structuredClone(second);
  assert.deepEqual(first.theme, site.pages[0].theme);
  first.theme.palette = 'midnight';
  first.sections[1].presentation.tone = 'accent';
  first.sections.find((section) => section.group === 'services').items[0].title = 'Custom offering';
  assert.deepEqual(site, before);
  assert.deepEqual(second, secondBefore);
  assert.equal(second.theme.palette, 'sage');
  assert.equal(second.theme.width, 'focused');
});

test('page projection and replacement preserve sibling content and shared brand', () => {
  const site = siteWithPages(), before = structuredClone(site), page = structuredClone(getPageSpec(site, 'story'));
  assert.equal(page.pages, undefined);
  page.sections[1].title = 'Edited article'; page.theme.width = 'focused'; page.brand.name = 'Shared name';
  const result = validateSpec(replacePageSpec(site, 'story', page));
  assert.deepEqual(result.sections, before.sections);
  assert.deepEqual(result.pages[0], before.pages[0]);
  assert.equal(result.pages[1].sections[1].title, 'Edited article');
  assert.equal(getPageSpec(result, 'journal').brand.name, 'Shared name');
  assert.deepEqual(site, before);
  assert.throws(() => replacePageSpec(site, 'missing', page), /not found/);
});

test('page addresses reject traversal, reserved Windows names, duplicate files and unsafe encodings', () => {
  for (const slug of ['../secret', 'sub/path', 'foo.html', 'foo?bar', 'foo#bar', 'JOURNAL', '%2e%2e', 'index', 'con', 'lpt9', 'source', '', '-start', 'a'.repeat(61)]) {
    const site = siteWithPages(); site.pages[0].slug = slug;
    assert.throws(() => validateSpec(site), /Page address/);
  }
  const duplicate = siteWithPages(); duplicate.pages[1].slug = 'journal';
  assert.throws(() => validateSpec(duplicate), /unique/);
});

test('page identifiers, titles, navigation flags and page count are bounded', () => {
  const mutateCases = [
    (s) => { s.pages[0].id = 'home'; }, (s) => { s.pages[0].id = 'story'; },
    (s) => { s.pages[0].id = '../x'; }, (s) => { s.pages[0].title = ' '; },
    (s) => { s.pages[0].title = 'x'.repeat(81); }, (s) => { s.pages[0].showInNav = 'false'; },
    (s) => { s.pages = {}; }, (s) => { s.pages = null; }
  ];
  for (const mutate of mutateCases) { const site = siteWithPages(); mutate(site); assert.throws(() => validateSpec(site)); }
  const site = siteWithPages();
  while (site.pages.length < 7) { const n = site.pages.length; site.pages.push(createPage(site, { id: `p${n}`, title: `Page ${n}`, slug: `page-${n}` })); }
  assert.equal(validateSpec(site).pages.length, 7);
  assert.throws(() => createPage(site, { id: 'too-many' }), /at most 8/);
  site.pages.push(structuredClone(site.pages[0]));
  assert.throws(() => validateSpec(site), /at most 8/);
});

test('page links resolve only registered page identities and existing section anchors', () => {
  const site = siteWithPages();
  site.brand.href = 'page:story#about';
  assert.equal(validateSpec(site).brand.href, 'page:story#about');
  assert.deepEqual(parsePageHref('page:story#about'), { pageId: 'story', sectionId: 'about' });
  for (const href of ['page:missing', 'page:story#missing']) {
    site.brand.href = href; assert.throws(() => validateSpec(site), /does not exist/);
  }
  for (const href of ['story.html', '/story', '//evil.example', 'page:../x', 'page:story?x', 'page:story#x/y', 'javascript:alert(1)']) assert.throws(() => safeHref(href));
  assert.equal(pageFilename(site, 'home'), 'index.html');
  assert.equal(pageFilename(site, 'story'), 'first-story.html');
  assert.throws(() => pageFilename(site, 'missing'));
});

test('renaming a page address preserves identity-based references', () => {
  const site = siteWithPages(); site.pages[1].slug = 'renamed-story';
  const result = validateSpec(site);
  assert.equal(result.pages[0].sections.find((s) => s.group === 'gallery').items[0].href, 'page:story');
  assert.equal(pageFilename(result, 'story'), 'renamed-story.html');
});

test('a legacy shared brand action keeps its Home destination across independent pages', () => {
  const site = siteWithPages();
  assert.equal(site.brand.href, 'page:home#contact');
  assert.equal(getPageSpec(site, 'journal').brand.href, 'page:home#contact');
  assert.equal(getPageSpec(site, 'story').brand.href, 'page:home#contact');
  assert.deepEqual(validateSpec(site), site);
});

test('deleting a page clears incoming actions and item links atomically, without mutating input', () => {
  const site = siteWithPages(); site.brand.href = 'page:story#about'; site.sections[1].href = 'page:story';
  const before = structuredClone(site), result = validateSpec(removePage(site, 'story'));
  assert.equal(result.pages.length, 1); assert.equal(result.brand.href, ''); assert.equal(result.sections[1].href, '');
  assert.equal(result.pages[0].sections.find((s) => s.group === 'gallery').items[0].href, '');
  assert.deepEqual(site, before);
  assert.throws(() => removePage(site, 'home'));
  assert.throws(() => removePage(site, 'missing'));
});

test('composition selects an existing page while retaining the full validated site at the boundary', () => {
  const base = { mode: 'demo', operation: 'edit', prompt: 'Make the heading quiet', spec: siteWithPages() };
  assert.equal(validateCompose(base).pageId, 'home');
  assert.equal(validateCompose({ ...base, pageId: 'story' }).spec.pages.length, 2);
  assert.throws(() => validateCompose({ ...base, pageId: 'missing' }), /not found/);
  assert.throws(() => validateCompose({ ...base, pageId: null }));
});

test('the complete site shares the existing four-megabyte budget across pages', () => {
  const site = siteWithPages();
  const image = paddedPng();
  for (const page of [site, ...site.pages]) { page.sections[1].image = image; page.sections[2].image = image; }
  assert.throws(() => validateSpec(site), /4 MB/);
});

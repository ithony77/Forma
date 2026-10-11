import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createSpec, makeSection } from '../shared/content.mjs';
import { createPage, MAX_PAGES } from '../shared/pages.mjs';
import { renderBody, renderDocument, themeCss } from '../shared/render.mjs';

const css = await readFile(new URL('../public/site.css', import.meta.url), 'utf8');
const script = await readFile(new URL('../public/site-runtime.js', import.meta.url), 'utf8');
const scriptHash = createHash('sha256').update(script).digest('base64');
function siteWithPages() {
  const site = createSpec('Field Notes');
  site.pages = [createPage(site, { id: 'journal', slug: 'journal', title: 'Journal', template: 'blog' })];
  site.pages.push(createPage(site, { id: 'article', slug: 'first-story', title: 'First story', template: 'article', showInNav: false }));
  site.pages[0].sections.find((section) => section.group === 'gallery').items[0].href = 'page:article#about';
  return site;
}

test('independent page renders its own sections and theme with shared brand and page navigation', () => {
  const site = siteWithPages();
  site.pages[0].theme.palette = 'midnight';
  const html = renderDocument(site, { css, script, scriptHash, pageId: 'journal' });
  assert.match(html, /<h1>Journal<\/h1>/);
  assert.match(html, /<title>Field Notes — Journal<\/title>/);
  assert.match(html, /href="index.html">Home<\/a>/);
  assert.match(html, /href="journal.html" aria-current="page">Journal<\/a>/);
  assert.match(html, /--bg:#171b1a/);
  assert.match(themeCss(site, { pageId: 'journal' }), /--bg:#171b1a/);
  assert.doesNotMatch(themeCss(site), /--bg:#171b1a/);
  assert.doesNotMatch(html, /<h2>.*?Pricing/);
  assert.doesNotMatch(html, /id="contact"/);
  assert.doesNotMatch(html, /href="first-story.html"[^>]*>First story<\/a>/);
});

test('page references in actions and gallery cards use portable registry filenames', () => {
  const site = siteWithPages();
  site.brand.href = 'page:journal';
  site.sections.find((section) => section.group === 'hero').href = 'page:article#about';
  const home = renderBody(site);
  const journal = renderBody(site, { pageId: 'journal' });
  assert.match(home, /class="site-button" href="journal.html"/);
  assert.match(home, /class="site-button" href="first-story.html#about"/);
  assert.match(journal, /class="gallery-card linked"/);
  assert.match(journal, /class="gallery-card-link" href="first-story.html#about"/);
  assert.doesNotMatch(home + journal, /href="page:/);
  assert.doesNotMatch(home + journal, /data-page-id|data-add-section|data-add-page|editor-add-menu/);
});

test('preview navigation identifies page and section without making iframe navigation requests', () => {
  const site = siteWithPages();
  const html = renderBody(site, { preview: true, pageId: 'journal' });
  assert.match(html, /href="index.html" data-page-id="home"/);
  assert.match(html, /href="#gallery" data-page-id="journal" data-target-section="gallery"/);
  assert.match(html, /href="first-story.html#about" data-page-id="article" data-target-section="about"/);
});

test('navigation includes every current body section, including process and call to action', () => {
  const site = createSpec();
  for (const group of ['process', 'pricing', 'services']) {
    if (!site.sections.some((section) => section.group === group)) site.sections.splice(site.sections.length - 1, 0, makeSection(group));
  }
  const navigation = renderBody(site).match(/<nav class="desktop-nav"[^>]*>(.*?)<\/nav>/s)[1];
  for (const section of site.sections.filter((entry) => !['navigation', 'hero', 'footer'].includes(entry.group))) {
    assert.ok(navigation.includes(`href="#${section.id}"`), section.group);
  }
});

test('preview add menu offers missing sections and all prepared page templates', () => {
  const site = siteWithPages();
  const html = renderBody(site, { preview: true, pageId: 'journal' });
  assert.match(html, /<summary aria-label="Add section or page"/);
  assert.match(html, /data-add-section="contact"/);
  assert.match(html, /data-add-section="gallery"/, 'Repeatable body sections remain insertable');
  assert.doesNotMatch(html, /data-add-section="hero"/);
  for (const template of ['general', 'blog', 'article']) assert.ok(html.includes(`data-add-page="${template}"`));
});

test('preview disables new page choices at the bounded page limit', () => {
  const site = createSpec();
  site.pages = Array.from({ length: MAX_PAGES - 1 }, (_, index) => createPage(site, { id: `page-${index}`, title: `Page ${index}`, slug: `page-${index}` }));
  const html = renderBody(site, { preview: true });
  for (const template of ['general', 'blog', 'article']) assert.ok(html.includes(`data-add-page="${template}" disabled`));
});

test('page names are escaped and unknown selected pages fail closed', () => {
  const site = siteWithPages();
  site.pages[0].title = '<img src=x onerror=alert(1)>';
  const html = renderBody(site);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.throws(() => renderBody(site, { pageId: 'missing' }), /Page not found/);
});

test('each gallery variant retains a link to the article with one native anchor per card', () => {
  const site = siteWithPages();
  for (const block of ['gallery-grid', 'gallery-featured', 'gallery-strip']) {
    site.pages[0].sections.find((section) => section.group === 'gallery').block = block;
    const html = renderBody(site, { pageId: 'journal' });
    const linkedCard = html.match(/<figure class="gallery-card linked">(.*?)<\/figure>/s)[1];
    assert.equal((linkedCard.match(/<a /g) || []).length, 1);
    assert.match(linkedCard, /href="first-story.html#about"/);
  }
});

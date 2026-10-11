import { PNG_IMAGE } from './fixtures/images.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpec, makeSection } from '../shared/content.mjs';
import { renderBody, renderDocument, resolveHref } from '../shared/render.mjs';
import { validateSpec } from '../shared/schema.mjs';

function example(group, block) {
  const site = createSpec();
  const section = makeSection(group, block);
  const index = site.sections.findIndex((entry) => entry.group === group);
  if (index < 0) site.sections.splice(site.sections.length - 1, 0, section);
  else site.sections[index] = section;
  return { site, section };
}
function markup(site, id, preview = false) {
  return renderBody(site, { preview }).match(new RegExp(`<(section|header|footer) id="${id}"[^>]*>[\\s\\S]*?</\\1>`))[0];
}

test('hero, navigation, footer and the last section can all be absent from render and export', () => {
  const site = createSpec();
  for (const group of ['hero', 'navigation', 'footer']) {
    site.sections = site.sections.filter((section) => section.group !== group);
    const html = renderBody(site);
    assert.ok(!html.includes('undefined'));
    assert.match(html, /<main id="forma-main">/);
  }
  site.sections = [];
  assert.equal(resolveHref('#deleted-section', site), '#forma-main');
  const preview = renderBody(site, { preview: true });
  assert.match(preview, /data-add-section="hero"/);
  const document = renderDocument(site, { css: '', script: '', scriptHash: '' });
  assert.match(document, /<main id="forma-main"><\/main>/);
  assert.ok(!document.includes('data-add-section'));
  assert.ok(!document.includes('editor-empty-page'));
});

test('hero-free wordmarks and skip link always have a real collision-free target', () => {
  const site = createSpec();
  site.sections = site.sections.filter((section) => section.group !== 'hero');
  site.sections.find((section) => section.group === 'features').id = 'forma-main';
  const html = renderBody(site);
  assert.match(html, /class="skip-link" href="#forma-main-1"/);
  assert.match(html, /<main id="forma-main-1">/);
  assert.equal((html.match(/id="forma-main"/g) || []).length, 1);
  assert.match(html, /class="wordmark" href="#forma-main"/);
  site.sections = site.sections.filter((section) => ['navigation', 'footer'].includes(section.group));
  assert.match(renderBody(site), /class="wordmark" href="#forma-main"/);
});

test('removing every hero part omits markup without replacing saved copy or media with a fallback', () => {
  for (const block of ['hero-split', 'hero-centered', 'hero-editorial']) {
    const { site, section } = example('hero', block);
    section.title = 'Unique removed title';
    section.body = 'Unique removed body';
    section.image = PNG_IMAGE;
    section.removedParts = ['heading', 'body', 'eyebrow', 'action', 'secondaryAction', 'media', 'footnote', 'decoration'];
    const html = markup(site, section.id, true);
    assert.doesNotMatch(html, /<h1|hero-description|eyebrow|site-button|text-link|hero-visual|hero-footnote|visual-label|data:image/);
    assert.match(html, /hero-inner without-media/);
    const restored = validateSpec(site).sections.find((entry) => entry.id === section.id);
    assert.equal(restored.title, 'Unique removed title');
    assert.equal(restored.body, 'Unique removed body');
    assert.equal(restored.image, section.image);
    section.removedParts = [];
    assert.match(markup(site, section.id), /Unique removed title/);
  }
});

test('deleting the primary hero action preserves the independent secondary action', () => {
  const { site, section } = example('hero', 'hero-split');
  section.removedParts = ['action'];
  const html = markup(site, section.id, true);
  assert.doesNotMatch(html, /class="site-button/);
  assert.match(html, /data-part-key="secondaryAction"/);
});

test('individual feature content is removable in every variant and sibling content survives', () => {
  for (const block of ['features-bento', 'features-cards', 'features-list']) {
    const { site, section } = example('features', block);
    const item = section.items[0];
    item.title = 'Deleted feature title'; item.body = 'Deleted feature description';
    item.removedParts = ['heading', 'body', 'icon', 'decoration'];
    const html = markup(site, section.id, true);
    assert.doesNotMatch(html, /Deleted feature title|Deleted feature description|bento-lines/);
    assert.match(html, /class="feature-card no-icon"/);
    assert.ok(html.includes(section.items[1].title));
    assert.ok(!html.includes(`data-owner-item-id="${item.id}"`));
    assert.equal((html.match(/class="feature-icon"/g) || []).length, section.items.length - 1);
  }
});

test('gallery media and metadata, service prices and process numbers delete without fallback components', () => {
  const gallery = example('gallery', 'gallery-grid');
  gallery.section.items.forEach((item) => { item.removedParts = ['media', 'meta']; });
  assert.doesNotMatch(markup(gallery.site, gallery.section.id), /gallery-visual|class="art|gallery-meta/);
  const services = example('services', 'services-list');
  services.section.items.forEach((item) => { item.price = 'Saved price'; item.removedParts = ['price', 'number']; });
  const serviceHtml = markup(services.site, services.section.id);
  assert.doesNotMatch(serviceHtml, /Saved price|service-price|index-number|<svg/);
  assert.match(serviceHtml, /without-number without-trailing/);
  const process = example('process', 'process-timeline');
  process.section.items.forEach((item) => { item.removedParts = ['number']; });
  assert.doesNotMatch(markup(process.site, process.section.id), /step-number/);
  assert.match(markup(process.site, process.section.id), /class="without-number"/);
});

test('deleted button text leaves a named icon action, while deleting both button children omits the action', () => {
  const { site, section } = example('hero', 'hero-split');
  section.button = 'Continue to my work';
  section.removedParts = ['buttonLabel'];
  let html = markup(site, section.id, true);
  assert.doesNotMatch(html, /class="button-label"/);
  assert.match(html, /aria-label="Continue to my work"/);
  assert.match(html, /data-part-key="buttonIcon"/);
  section.removedParts.push('buttonIcon');
  html = markup(site, section.id, true);
  assert.doesNotMatch(html, /class="site-button/);
  const pricing = example('pricing', 'pricing-featured');
  pricing.section.items[0].removedParts = ['heading', 'body', 'price', 'meta', 'action'];
  html = markup(pricing.site, pricing.section.id, true);
  assert.ok(!html.includes(`data-owner-item-id="${pricing.section.items[0].id}"`));
  assert.ok(html.includes(`data-owner-item-id="${pricing.section.items[1].id}"`));
});

test('FAQ heading deletion keeps its answer readable without an unnamed disclosure', () => {
  const { site, section } = example('faq', 'faq-accordion');
  section.items.forEach((item) => { item.removedParts = ['heading']; });
  const html = markup(site, section.id);
  assert.doesNotMatch(html, /<details|<summary/);
  assert.match(html, /<article class="faq-item">/);
  assert.ok(html.includes(section.items[0].body));
});

test('form fields and complete form delete independently and the layout collapses', () => {
  const { site, section } = example('contact', 'contact-form');
  section.removedParts = ['nameField', 'emailField', 'messageField', 'footnote'];
  let html = markup(site, section.id, true);
  assert.doesNotMatch(html, /<input|<textarea|form-note/);
  assert.match(html, /<form class="contact-fields"/);
  assert.match(html, /type="submit"/);
  section.removedParts.push('form');
  html = markup(site, section.id);
  assert.doesNotMatch(html, /<form|type="submit"/);
  assert.match(html, /contact-inner without-form/);
});

test('navigation and footer parts remove actual markup and preview markers never leak into export', () => {
  const site = createSpec();
  const nav = site.sections.find((section) => section.group === 'navigation');
  nav.removedParts = ['brand', 'navigation', 'action'];
  let html = markup(site, nav.id);
  assert.doesNotMatch(html, /wordmark|<nav|site-button|mobile-nav/);
  const footer = site.sections.find((section) => section.group === 'footer');
  footer.block = 'footer-columns';
  footer.removedParts = ['brand', 'body', 'navigation', 'backToTop'];
  html = markup(site, footer.id);
  assert.doesNotMatch(html, /wordmark|<nav|back-to-top|<p>/);
  const exported = renderBody(site);
  assert.doesNotMatch(exported, /data-part-key|data-owner-item-id|data-item-id|data-add-section|editor-empty-page/);
});

import { PNG_IMAGE } from './fixtures/images.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpec, makeSection } from '../shared/content.mjs';
import { validateSpec } from '../shared/schema.mjs';
import { renderBody } from '../shared/render.mjs';
import { slotsFor, placementFor } from '../shared/slots.mjs';
import { icon } from '../shared/icons.mjs';

function fixture(group, block) {
  const site = createSpec(), section = makeSection(group, block);
  const index = site.sections.findIndex((entry) => entry.group === group);
  if (index >= 0) site.sections[index] = section;
  else site.sections.splice(-1, 0, section);
  return { site, section };
}
function markup(site, section, preview = false) {
  return renderBody(site, { preview }).match(new RegExp(`<section id="${section.id}"[^>]*>[\\s\\S]*?</section>`))[0];
}

test('hero media placements preserve image content and real reading order in preview and export', () => {
  for (const block of ['hero-split', 'hero-editorial']) {
    const { site, section } = fixture('hero', block);
    section.image = PNG_IMAGE; section.alt = 'User supplied image';
    for (const position of ['before', 'after']) {
      const placement = placementFor(section, { sectionId: section.id }, 'media', 'hero-media', position);
      assert.equal(placement.field, 'mediaPlacement');
      section.elements[placement.field] = placement.value;
      for (const preview of [false, true]) {
        const html = markup(site, section, preview);
        assert.equal(html.indexOf('class="hero-visual"') < html.indexOf('class="hero-copy"'), position === 'before');
        assert.ok(html.includes('alt="User supplied image"'));
        assert.equal(html.includes('data-part-key="media" data-part-slot="hero-media"'), preview);
      }
    }
    section.elements.mediaPlacement = 'default';
    assert.equal(placementFor(section, { sectionId: section.id }, 'media', 'hero-media', 'after').changed, false);
  }
  const centered = fixture('hero', 'hero-centered');
  assert.ok(!slotsFor(centered.section).some((slot) => slot.partKey === 'media'));
  assert.equal(placementFor(centered.section, { sectionId: centered.section.id }, 'media', 'hero-media', 'before').allowed, false);
});

test('authored content placement changes preview and exported DOM reading order', () => {
  for (const [group, block] of [['hero', 'hero-split'], ['about', 'about-split'], ['cta', 'cta-card'], ['contact', 'contact-simple']]) {
    const { site, section } = fixture(group, block);
    section.title = 'Unique heading'; section.body = 'Unique description'; section.button = 'Unique action'; section.href = 'https://example.com/action';
    section.elements.primaryAction = 'show';
    for (const order of ['heading-action-body', 'action-body-heading', 'body-heading-action']) {
      section.elements.contentOrder = order;
      for (const preview of [true, false]) {
        const html = markup(site, section, preview);
        const positions = { heading: html.indexOf('Unique heading'), body: html.indexOf('Unique description'), action: html.indexOf('Unique action') };
        const parts = order.split('-');
        assert.ok(positions[parts[0]] < positions[parts[1]] && positions[parts[1]] < positions[parts[2]], `${block}: ${order}`);
      }
    }
  }
});

test('feature icon and text placements belong to the selected item', () => {
  const { site, section } = fixture('features', 'features-list');
  section.items[0].placements = { iconPlacement: 'above', textOrder: 'body-heading', buttonIconPlacement: 'default' };
  const html = markup(site, section, true), articles = [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)].map((entry) => entry[0]);
  assert.ok(articles[0].includes('data-icon-placement="above"'));
  assert.ok(articles[0].indexOf('data-part-key="body"') < articles[0].indexOf('data-part-key="heading"'));
  assert.ok(articles[1].indexOf('data-part-key="heading"') < articles[1].indexOf('data-part-key="body"'));
  assert.ok(!articles[1].includes('data-icon-placement="above"'));
});

test('button icon leading and trailing placements use actual HTML order including item overrides', () => {
  for (const group of ['hero', 'pricing']) {
    const { site, section } = fixture(group);
    section.elements.buttonIconPlacement = 'leading';
    if (group === 'pricing') section.items[0].placements.buttonIconPlacement = 'trailing';
    const buttons = [...markup(site, section, true).matchAll(/<a class="site-button[^>]*>[\s\S]*?<\/a>/g)].map((entry) => entry[0]);
    assert.ok(buttons.length);
    if (group === 'hero') assert.ok(buttons[0].indexOf('data-part-key="buttonIcon"') < buttons[0].indexOf('button-label'));
    else {
      assert.ok(buttons[0].indexOf('button-label') < buttons[0].indexOf('data-part-key="buttonIcon"'));
      assert.ok(buttons[1].indexOf('data-part-key="buttonIcon"') < buttons[1].indexOf('button-label'));
    }
  }
});

test('pricing item button icons override inherited choices independently and survive normalization', () => {
  const { site, section } = fixture('pricing');
  section.elements.buttonIcon = 'none';
  section.items[0].buttonIcon = 'mail';
  section.items[0].placements.buttonIconPlacement = 'leading';
  const html = markup(site, section), buttons = [...html.matchAll(/<a class="site-button[^>]*>[\s\S]*?<\/a>/g)].map((entry) => entry[0]);
  assert.ok(buttons[0].includes(icon('mail', 16)));
  assert.ok(buttons[0].indexOf('<svg') < buttons[0].indexOf('button-label'));
  assert.ok(!buttons[1].includes('<svg'));
  assert.ok(slotsFor(section, section.items[0].id).some((part) => part.partKey === 'buttonIcon'));
  assert.ok(!slotsFor(section, section.items[1].id).some((part) => part.partKey === 'buttonIcon'));
  assert.equal(validateSpec(JSON.parse(JSON.stringify(site))).sections.find((entry) => entry.id === section.id).items[0].buttonIcon, 'mail');
  section.elements.buttonIcon = 'check'; section.items[0].buttonIcon = 'none';
  const overridden = [...markup(site, section).matchAll(/<a class="site-button[^>]*>[\s\S]*?<\/a>/g)].map((entry) => entry[0]);
  assert.ok(!overridden[0].includes('<svg'));
  assert.ok(overridden[1].includes(icon('check', 16)));
});

test('legacy item button icons inherit the section and unapproved glyphs are rejected', () => {
  const { site, section } = fixture('pricing');
  delete section.items[0].buttonIcon;
  const normalized = validateSpec(site).sections.find((entry) => entry.id === section.id);
  assert.equal(normalized.items[0].buttonIcon, 'default');
  section.items[0].buttonIcon = '<svg onload=alert(1)>';
  assert.throws(() => renderBody(site), /item button icon/);
});

test('preview identity metadata is present for all item families and absent from export', () => {
  for (const group of ['features', 'gallery', 'services', 'process', 'pricing', 'faq']) {
    const { site, section } = fixture(group), preview = markup(site, section, true), exported = markup(site, section);
    for (const item of section.items) assert.ok(preview.includes(`data-item-id="${item.id}"`));
    for (const attribute of ['data-item-id', 'data-item-index', 'data-part-key', 'data-part-slot', 'data-owner-item-id', 'editor-selection-tools']) assert.ok(!exported.includes(attribute), `${group}: ${attribute}`);
  }
});

test('gallery artwork and highlighted plan follow normalized identity after reordering', () => {
  const gallery = fixture('gallery');
  const normalized = validateSpec(gallery.site), section = normalized.sections.find((entry) => entry.group === 'gallery');
  const art = section.items[1].art;
  section.items.unshift(section.items.splice(1, 1)[0]);
  const html = markup(normalized, section);
  const firstCard = html.match(/<figure\b[\s\S]*?<\/figure>/)[0];
  assert.ok(firstCard.includes(`art-${(art + 1) % 4}`));
  const pricing = fixture('pricing', 'pricing-featured'), plan = pricing.section.items[1];
  pricing.section.items.unshift(pricing.section.items.splice(1, 1)[0]);
  assert.equal(pricing.section.featuredItemId, plan.id);
  assert.match(markup(pricing.site, pricing.section), /<div class="pricing-grid"><article class="pricing-card featured">/);
});

test('authored slots reject foreign owners and unsupported nesting while headings remain removable', () => {
  const { section } = fixture('hero');
  assert.equal(placementFor(section, { sectionId: 'other' }, 'heading', 'content', null).allowed, false);
  assert.equal(placementFor(section, { sectionId: section.id }, 'heading', 'button-icon', 'leading').allowed, false);
  const slots = slotsFor(section);
  assert.equal(slots.find((slot) => slot.partKey === 'heading').required, false);
  assert.equal(placementFor(section, { sectionId: section.id }, 'heading', 'content', 'heading').changed, false);
  const moved = placementFor(section, { sectionId: section.id }, 'action', 'content', 'body');
  assert.equal(moved.value, 'heading-action-body');
});

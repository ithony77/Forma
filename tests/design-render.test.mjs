import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { CATALOG, THEMES } from '../shared/catalog.mjs';
import { TYPE_SCALES, CONTENT_WIDTHS, PRESENTATION, presentationFieldsFor } from '../shared/design.mjs';
import { createSpec, makeSection } from '../shared/content.mjs';
import { renderBody, renderDocument, themeCss } from '../shared/render.mjs';

const css = await readFile(new URL('../public/site.css', import.meta.url), 'utf8');
const script = await readFile(new URL('../public/site-runtime.js', import.meta.url), 'utf8');
const scriptHash = createHash('sha256').update(script).digest('base64');
const tokens = (spec) => Object.fromEntries([...themeCss(spec).matchAll(/(--[\w-]+):([^;}]*)/g)].map((match) => [match[1], match[2]]));

test('legacy projects render with the same normalized presentation and theme as explicit defaults', () => {
  const current = createSpec();
  const legacy = structuredClone(current);
  delete legacy.theme.typeScale;
  delete legacy.theme.width;
  for (const section of legacy.sections) delete section.presentation;
  assert.equal(renderBody(legacy), renderBody(current));
  assert.equal(themeCss(legacy), themeCss(current));
  const defaults = tokens(legacy);
  assert.equal(defaults['--content-width'], '1120px');
  assert.equal(defaults['--display-size'], 'clamp(44px,5.7vw,76px)');
  assert.equal(defaults['--mobile-display-size'], '44px');
});

test('all catalog variants retain their class and expose only applicable bounded presentation choices', () => {
  for (const block of CATALOG) {
    const spec = createSpec();
    const section = makeSection(block.group, block.id);
    const index = spec.sections.findIndex((item) => item.group === block.group);
    if (index < 0) spec.sections.splice(spec.sections.length - 1, 0, section);
    else spec.sections[index] = section;
    for (const field of presentationFieldsFor(block.group)) {
      for (const choice of Object.keys(PRESENTATION[field])) {
        section.presentation[field] = choice;
        const html = renderBody(spec, { preview: true });
        const startTag = html.match(new RegExp(`<(?:section|header|footer) id="${section.id}"[^>]*>`))[0];
        assert.match(startTag, new RegExp(`class="site-section ${block.id}(?: app-section)?"`), block.id);
        assert.ok(startTag.includes(`data-${field}="${choice}"`), `${block.id}: ${field} ${choice}`);
        for (const unused of Object.keys(PRESENTATION).filter((name) => !presentationFieldsFor(block.group).includes(name))) {
          assert.ok(!startTag.includes(`data-${unused}=`), `${block.id}: inapplicable ${unused}`);
        }
        assert.ok(startTag.includes(`data-section="${section.id}"`));
        assert.ok(!html.includes('undefined'));
      }
    }
  }
});

test('type hierarchy and content width vary independently across every palette', () => {
  for (const palette of Object.keys(THEMES)) {
    const seenTypes = new Set();
    const seenWidths = new Set();
    for (const typeScale of Object.keys(TYPE_SCALES)) {
      for (const width of Object.keys(CONTENT_WIDTHS)) {
        const spec = createSpec();
        Object.assign(spec.theme, { palette, typeScale, width });
        const result = tokens(spec);
        seenTypes.add(result['--display-size']);
        seenWidths.add(result['--content-width']);
        assert.equal(result['--bg'], THEMES[palette].bg);
        assert.ok(!themeCss(spec).includes('undefined'));
        assert.match(renderBody(spec), new RegExp(`data-type-scale="${typeScale}" data-width="${width}"`));
      }
    }
    assert.equal(seenTypes.size, 3);
    assert.equal(seenWidths.size, 3);
  }
});

function rgb(hex) { return hex.slice(1).match(/../g).map((part) => parseInt(part, 16)); }
function luminance(color) {
  return color.map((part) => part / 255).map((part) => part <= .04045 ? part / 12.92 : ((part + .055) / 1.055) ** 2.4).reduce((sum, part, index) => sum + part * [.2126, .7152, .0722][index], 0);
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
  return (values[0] + .05) / (values[1] + .05);
}
function tokenColor(value) {
  if (value.startsWith('#')) return rgb(value);
  const mix = value.match(/^color-mix\(in srgb,(#[0-9a-f]{6}) (\d+)%,(#[0-9a-f]{6})\)$/);
  assert.ok(mix, `Unsupported test color ${value}`);
  const weight = Number(mix[2]) / 100;
  return rgb(mix[1]).map((part, index) => part * weight + rgb(mix[3])[index] * (1 - weight));
}

test('contrast sections keep readable text and paired button colors in light and dark palettes', () => {
  for (const palette of Object.keys(THEMES)) {
    const spec = createSpec();
    spec.theme.palette = palette;
    const result = tokens(spec);
    for (const foreground of ['--contrast-ink', '--contrast-muted']) {
      for (const background of ['--contrast-bg', '--contrast-surface', '--contrast-soft']) {
        assert.ok(contrast(tokenColor(result[foreground]), tokenColor(result[background])) >= 4.5, `${palette}: ${foreground} on ${background}`);
      }
    }
    assert.ok(contrast(tokenColor(result['--contrast-on-accent']), tokenColor(result['--contrast-accent'])) >= 4.5, `${palette}: button`);
    assert.equal(result['--contrast-scheme'], THEMES[palette].dark ? 'light' : 'dark');
  }
});

test('render entry points reject injected design values instead of interpolating CSS or attributes', () => {
  const malicious = '\"><script>alert(1)</script>';
  for (const field of Object.keys(PRESENTATION)) {
    const spec = createSpec();
    spec.sections[1].presentation[field] = malicious;
    assert.throws(() => renderBody(spec));
    assert.throws(() => renderDocument(spec, { css, script, scriptHash }));
  }
  for (const field of ['typeScale', 'width']) {
    const spec = createSpec();
    spec.theme[field] = '</style><script>alert(1)</script>';
    assert.throws(() => themeCss(spec));
    assert.throws(() => renderBody(spec));
  }
});

test('rich presentation uses the same escaped content and fixed script in preview and export', () => {
  const spec = createSpec();
  spec.sections[1].title = '<script>untrusted</script>';
  for (const section of spec.sections) Object.assign(section.presentation, { tone: 'contrast', spacing: 'generous', heading: 'center', surface: 'filled', media: 'portrait' });
  const options = { css, script, scriptHash };
  const exported = renderDocument(spec, options);
  const preview = renderDocument(spec, { ...options, preview: true, channel: 'test-channel' });
  for (const document of [exported, preview]) {
    assert.equal((document.match(/<script>/g) || []).length, 1);
    assert.ok(document.includes('&lt;script&gt;untrusted&lt;/script&gt;'));
    assert.ok(document.includes(`sha256-${scriptHash}`));
    assert.ok(document.includes("connect-src &#39;none&#39;"));
    assert.ok(document.includes('data-tone="contrast" data-spacing="generous" data-heading="center" data-media="portrait"'));
    assert.ok(!/<(?:script|img|link)[^>]+(?:src|href)="https?:/i.test(document));
  }
  assert.ok(preview.includes('data-channel="test-channel"'));
  assert.ok(!exported.includes('data-channel="test-channel"'));
});

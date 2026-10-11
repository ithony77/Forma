/** Closed style presets. CSS remains authored locally; manual controls override defaults. */
const style = (name, description, palette, font, density, radius, typeScale, width, motion = 'none') => ({ name, description, defaults: { palette, font, density, radius, typeScale, width, motion } });
export const STYLE_PRESETS = {
  swiss: style('Swiss Editorial', 'Precise rules, a strong grid and large sans-serif headings.', 'mono', 'modern', 'airy', 'sharp', 'dramatic', 'wide'),
  paper: style('Warm Paper', 'Warm paper surfaces, serif headings and print-like rules.', 'porcelain', 'editorial', 'airy', 'sharp', 'dramatic', 'standard'),
  luxury: style('Quiet Luxury', 'Fine borders, spacious serif typography and understated actions.', 'sand', 'editorial', 'airy', 'soft', 'quiet', 'focused'),
  botanical: style('Botanical', 'Organic colors, generous imagery and softened panels.', 'forest', 'editorial', 'airy', 'round', 'balanced', 'wide'),
  industrial: style('Industrial', 'Dense structure, square controls and measured typography.', 'slate', 'technical', 'compact', 'sharp', 'balanced', 'wide'),
  brutalist: style('Neo-Brutalist', 'Bold borders, offset shadows and assertive color blocking.', 'cobalt', 'modern', 'balanced', 'sharp', 'dramatic', 'wide'),
  product: style('Soft Product', 'Clear product hierarchy, rounded geometry and layered surfaces.', 'ocean', 'modern', 'balanced', 'soft', 'balanced', 'standard', 'subtle'),
  studio: style('Dark Studio', 'Dark surfaces, large imagery and selective accent lighting.', 'midnight', 'modern', 'airy', 'soft', 'dramatic', 'wide', 'subtle'),
  glass: style('Frosted Glass', 'Translucent local panels with legible opaque fallbacks.', 'ink', 'modern', 'balanced', 'soft', 'balanced', 'standard', 'subtle'),
  pastel: style('Playful Pastel', 'Pastel blocks, expressive shapes and tactile controls.', 'lavender', 'modern', 'balanced', 'round', 'dramatic', 'wide', 'subtle'),
  mono: style('Technical Mono', 'Monospaced headings, compact controls and tabular measures.', 'slate', 'technical', 'compact', 'sharp', 'quiet', 'standard'),
  gallery: style('Gallery Minimal', 'Image-led compositions, quiet framing and generous whitespace.', 'mono', 'modern', 'airy', 'sharp', 'quiet', 'wide')
};
export function styleTheme(current, key, locks = {}) {
  const preset = STYLE_PRESETS[key];
  if (!preset) throw new Error('Unknown visual style.');
  if (locks.style) return { ...current };
  return { ...current, ...Object.fromEntries(Object.entries(preset.defaults).filter(([field]) => !locks[field])), style: key };
}

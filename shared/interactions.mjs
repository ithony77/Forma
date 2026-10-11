/** Authored interaction vocabulary. Values select local implementations, never code. */
export const MOTION_OPTIONS = Object.freeze({ none: 'No animation', subtle: 'Subtle hover only', expressive: 'Interaction and scroll motion' });
export const INTERACTION_CONTROLS = {
  actionMotion: { label: 'Link and button interaction', description: 'Choose an authored arrow slide or underline. Actions and labels remain unchanged. Decorative movement follows the page motion setting.', options: { default: 'No added interaction', arrow: 'Arrow slide', underline: 'Animated underline' }, groups: ['navigation', 'hero', 'features', 'about', 'services', 'gallery', 'pricing', 'contact', 'cta', 'footer'] },
  cardInteraction: { label: 'Card interaction', description: 'Add a restrained lift or theme-colored pointer spotlight to compatible cards. Content stays visible and reduced motion disables pointer tracking.', options: { default: 'Component default', none: 'No card interaction', lift: 'Gentle lift', spotlight: 'Pointer spotlight' }, groups: ['features', 'services', 'gallery', 'process', 'pricing'], excludeBlocks: ['features-list', 'services-list', 'services-reveal', 'process-timeline', 'process-stacked', 'gallery-stack', 'gallery-carousel'] },
  entrance: { label: 'Section entrance', description: 'A one-time fade or rise when this section enters view. Requires Interaction and scroll motion. Inspect and reduced motion show content immediately.', options: { default: 'No entrance', fade: 'Fade into view', rise: 'Rise into view' }, groups: ['hero', 'features', 'about', 'services', 'gallery', 'process', 'pricing', 'faq', 'contact', 'cta'] }
};
export const INTERACTION_SOURCES = Object.freeze({
  fancy: Object.freeze({ name: 'Fancy Components', license: 'MIT', revision: 'f9f62c61207b2dd3210476dd98af3c9a5be24094', url: 'https://github.com/danielpetho/fancy', component: 'src/fancy/components/text/underline-center.tsx; src/fancy/components/blocks/stacking-cards.tsx' }),
  watermelon: Object.freeze({ name: 'Watermelon UI', license: 'MIT', revision: '86052b8fd12bc19bf3bac07625a7f93736c42b17', url: 'https://github.com/WatermelonCorp/watermellon-registry', component: 'components/watermelon/continuous-tabs.tsx' }),
  uselayouts: Object.freeze({ name: 'useLayouts', license: 'MIT', revision: '07cc4f4fb8e064643168e6fc8792127af92637f5', url: 'https://github.com/iurvish/uselayouts', component: 'registry/default/example/polaroid-stack.tsx' }),
  cult: Object.freeze({ name: 'Cult UI', license: 'MIT', revision: '67a66c6ac1cd240914ba688a907611b3437a7a2b', url: 'https://github.com/nolly-studio/cult-ui', component: 'registry/default/ui/shift-card.tsx' }),
  velora: Object.freeze({ name: 'Velora UI', license: 'MIT', revision: 'a07bcc129b45eeed3fc070357a6a74b876d96159', url: 'https://github.com/ColorlibHQ/velora-ui', component: 'src/components/velora/spotlight-card.tsx' })
});
export function interactionCapabilities(block) {
  const id = block.id;
  return Object.freeze({
    behavior: ({ 'features-spotlight': 'spotlight', 'services-reveal': 'disclosure', 'gallery-carousel': 'carousel', 'gallery-stack': 'photo-stack', 'process-stacked': 'scroll-stack' })[id] || (id.startsWith('app-') ? 'application' : 'static'),
    itemLimit: 8,
    media: block.group === 'gallery' ? 'item' : ['hero-split', 'hero-editorial', 'about-split'].includes(id) ? 'section' : 'none',
    fallback: 'All authored content remains available without animation.',
    sources: ({ 'features-spotlight': ['velora'], 'services-reveal': ['cult'], 'gallery-carousel': ['watermelon'], 'gallery-stack': ['uselayouts'], 'process-stacked': ['fancy'] })[id] || []
  });
}

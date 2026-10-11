/** Editable prepared showcases, assembled from the same catalog as user projects. */
import { createSpec, makeSection } from './content.mjs';
import { getBlock } from './catalog.mjs';
import { styleTheme } from './styles.mjs';
import { makeWidget } from './widgets.mjs';
import { validateSpec } from './schema.mjs';
export const SHOWCASES = {
  architecture: { name: 'Architecture studio', brand: 'Northline Studio', family: 'studio', style: 'swiss', secondStyle: 'luxury', description: 'A spatial portfolio with selected projects, chaptered story and guided inquiry.', blocks: ['nav-progress', 'hero-cover', 'gallery-masonry', 'about-chapters', 'services-selector', 'process-milestones', 'team-grid', 'contact-guided', 'footer-wordmark'], widgets: ['lightbox', 'breadcrumbs'] },
  software: { name: 'Software product', brand: 'Orbit Workspace', family: 'saas', style: 'product', secondStyle: 'glass', description: 'An interactive product tour with comparison, period pricing and searchable answers.', blocks: ['nav-mega', 'hero-browser', 'features-tabs', 'features-comparison', 'logos-wall', 'pricing-period', 'faq-search', 'cta-image', 'footer-sitemap'], widgets: ['segmented', 'dialog', 'toast'] },
  photographer: { name: 'Photography portfolio', brand: 'Frame Studies', family: 'portfolio', style: 'gallery', secondStyle: 'studio', description: 'A visual portfolio with a collage introduction, albums and a separate project collection.', blocks: ['nav-fullscreen', 'hero-collage', 'gallery-albums', 'gallery-lightbox', 'about-statement', 'contact-simple', 'footer-wordmark'], widgets: ['filters', 'copy'] },
  hotel: { name: 'Boutique stay', brand: 'Stillwater House', family: 'hospitality', style: 'botanical', secondStyle: 'paper', description: 'An accommodation example with imagery, amenities, local inquiries and grouped answers.', blocks: ['nav-shrink', 'hero-halves', 'gallery-thumbnails', 'features-media', 'pricing-offer', 'faq-groups', 'contact-directory', 'footer-contact'], widgets: ['range', 'popover', 'wizard'] },
  agency: { name: 'Creative agency', brand: 'Common Ground', family: 'studio', style: 'brutalist', description: 'An expressive agency composition with connected process, work filters and team search.', blocks: ['nav-dock', 'hero-poster', 'features-diagram', 'gallery-filter', 'quotes-slider', 'team-directory', 'contact-simple', 'footer-wordmark'], widgets: ['split', 'confirm', 'collapse'] },
  store: { name: 'Product storefront', brand: 'Everyday Objects', family: 'application', style: 'pastel', description: 'Product detail, editable local order controls and supporting product imagery.', blocks: ['nav-minimal', 'app-product', 'gallery-compare', 'features-expand', 'faq-sidebar', 'footer-contact'], widgets: ['compare', 'menu', 'empty'] },
  analytics: { name: 'Analytics workspace', brand: 'Measure Workspace', family: 'application', style: 'industrial', description: 'An authored record workspace with sorting, searching and supporting activity.', blocks: ['app-analytics', 'stats-band', 'process-milestones'], widgets: ['sort', 'pagination', 'alert', 'combobox'] },
  projects: { name: 'Project management', brand: 'Fieldwork', family: 'application', style: 'mono', description: 'A project detail workspace with task progress, local shortcuts and editable stages.', blocks: ['app-project', 'features-tabs', 'about-chapters'], widgets: ['command', 'drawer', 'tags', 'stepper'] }
};
export function makeShowcase(key) {
  const example = SHOWCASES[key];
  if (!example) throw new Error('Unknown showcase project.');
  const site = createSpec(example.brand);
  site.name = example.name + ' · prepared example'; site.family = example.family;
  site.brief = example.description; site.brand.tagline = 'Prepared example. Replace content and verify facts before publishing.';
  site.theme = styleTheme(site.theme, example.style);
  const used = new Set();
  site.sections = example.blocks.map((id) => {
    const block = getBlock(id), section = makeSection(block.group, id, example.family);
    let suffix = 2; while (used.has(section.id)) section.id = block.group + '-' + suffix++; used.add(section.id);
    section.body = section.body || example.description;
    return section;
  });
  const primary = site.sections.find((section) => section.group === 'hero');
  primary.widgets = example.widgets.map((kind, index) => makeWidget(kind, 'example-element-' + (index + 1)));
  if (!primary.block.startsWith('app-')) primary.title = { architecture: 'Spaces shaped around the way we live.', software: 'A clearer place for your next idea.', photographer: 'Quiet moments. A closer perspective.', hotel: 'Make room for a slower day.', agency: 'Good ideas deserve to be seen.' }[key] || example.name;
  if (example.secondStyle) {
    const sections = ['navigation', 'hero', 'gallery', 'contact', 'footer'].map((group) => makeSection(group));
    sections[1].title = 'A closer look at the collection.';
    site.pages = [{ id: 'collection', slug: 'collection', title: 'Collection', showInNav: true, family: example.family, brief: 'Prepared supporting page.', theme: styleTheme(site.theme, example.secondStyle), sections }];
  }
  return validateSpec(site);
}

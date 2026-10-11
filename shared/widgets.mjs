/** Bounded reusable element slots. Temporary visitor values never modify project data. */
const element = (name, category, description, options = ['First option', 'Second option', 'Third option']) => ({ name, category, description, options, source: 'Forma original · MIT' });
export const WIDGETS = {
  split: element('Split action', 'Actions', 'A primary action and a disclosure of related destinations.'),
  copy: element('Copy confirmation', 'Actions', 'Copies authored text or exposes selectable text when clipboard access is unavailable.'),
  confirm: element('Confirmation action', 'Actions', 'An explicit accessible confirmation before changing local demonstration state.'),
  segmented: element('Segmented selector', 'Actions', 'A mutually exclusive set of choices with visible selected state.'),
  command: element('Command palette', 'Navigation', 'Searchable authored destinations in a keyboard-accessible dialog.'),
  menu: element('Dropdown menu', 'Navigation', 'A native disclosure menu of named destinations.'),
  breadcrumbs: element('Breadcrumb trail', 'Navigation', 'A readable sequence of named navigation steps.'),
  pagination: element('Pagination', 'Navigation', 'Changes the visible page of an authored local collection.'),
  dialog: element('Dialog', 'Panels', 'A modal with Escape, focus restoration and authored content.'),
  drawer: element('Drawer', 'Panels', 'A dismissible side sheet containing authored content.'),
  popover: element('Popover', 'Panels', 'An anchored disclosure with a readable content panel.'),
  collapse: element('Collapsible panel', 'Panels', 'A native summary and details disclosure.'),
  combobox: element('Searchable choice', 'Inputs', 'A labeled search field filters selectable authored options.'),
  range: element('Range slider', 'Inputs', 'A native range control exposes its current value.'),
  wizard: element('Multistep form', 'Inputs', 'Next and back controls move through labeled local form steps.'),
  tags: element('Tag input', 'Inputs', 'Adds and removes bounded text tags using accessible controls.'),
  toast: element('Toast feedback', 'Feedback', 'Announces authored feedback in a polite status region.'),
  alert: element('Inline alert', 'Feedback', 'A dismissible authored notice with persistent readable text.'),
  stepper: element('Progress stepper', 'Feedback', 'Selectable authored stages indicate current progress.'),
  empty: element('Actionable empty state', 'Feedback', 'An empty collection with an action that adds a local sample entry.'),
  compare: element('Image comparison', 'Media and data', 'A native slider compares two authored images.'),
  lightbox: element('Image lightbox', 'Media and data', 'A local image viewer with named navigation controls.'),
  sort: element('Sortable records', 'Media and data', 'Sorts and searches a small authored local table.'),
  filters: element('Filter chips', 'Media and data', 'Category chips filter an authored local collection.')
};
export const WIDGET_SLOTS = ['tools', 'content'];
export function widgetFields(kind) {
  const fields = ['label', 'body'];
  if (!['copy', 'confirm', 'range', 'toast', 'alert', 'empty', 'lightbox'].includes(kind)) fields.push('options');
  if (['menu', 'split', 'popover', 'collapse', 'dialog', 'drawer', 'command', 'breadcrumbs', 'pagination', 'combobox', 'filters'].includes(kind)) fields.push('href');
  return fields;
}
export function widgetFits(section, slot = 'content') { return Boolean(section && WIDGET_SLOTS.includes(slot) && !['navigation', 'footer'].includes(section.group)); }
export function makeWidget(kind, id) {
  if (!Object.hasOwn(WIDGETS, kind)) throw new Error('Unknown reusable element.');
  const entry = WIDGETS[kind];
  return { id, kind, slot: 'content', label: entry.name, body: entry.description, options: [...entry.options], href: '' };
}

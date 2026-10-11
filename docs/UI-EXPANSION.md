# Expanded component and style library

The library contains **105 blocks** (82 website blocks and 23 app screens),
**24 reusable elements**, **12 coordinated styles**, **12 palettes** and **8
editable showcase projects**. The expansion adds 60 authored blocks to the
previous 45. Theme variations do not count as additional blocks.

Open **Components** to browse All components, Interactive components, Elements,
Styles or Examples. Search works in English and the selected editor language.
Blocks also have category and reference filters. A Preview opens one sandboxed
frame on demand; its desktop/mobile controls do not change the current project.
Elements attach to the selected unlocked content section (at most four), before
or after its content. Edit their text, options and safe destination in Content.
Media elements use that section's images, or clearly prepared local visuals.
Opening an example saves the current project first and creates a new project.

## New blocks

| Family | Added compositions |
| --- | --- |
| Navigation (6) | Dock, mega menu, fullscreen menu, desktop side rail, shrinking header, section progress |
| Introduction (8) | Full image, split screen, browser frame, phone frame, image collage, poster, product tour, scroll layers |
| Features and story (8) | Product tabs, comparison matrix, alternating media, expandable grid, workflow diagram, chaptered story, service selector, milestones |
| Gallery (8) | Masonry, justified rows, thumbnails, comparison, lightbox, project filters, albums, image accordion |
| Evidence (8) | Featured quote, quote grid, quote navigator, team portraits, team search, logo wall, optional logo motion, statistics |
| Conversion (6) | Period pricing, comparison pricing, lead offer, guided inquiry, contact directory, image invitation |
| Applications (10) | Commands, analytics, files, notifications, activity, onboarding, project detail, product detail, account and billing, help |
| Answers and footers (6) | Searchable answers, grouped answers, indexed answers, sitemap, contact footer, large wordmark |

## Reusable elements

| Category | Elements |
| --- | --- |
| Actions | Split action, copy confirmation, confirmation action, segmented selector |
| Navigation | Command palette, dropdown, breadcrumbs, pagination |
| Panels | Dialog, drawer, popover, collapsible panel |
| Inputs | Searchable choice, range, multistep form, bounded tags |
| Feedback | Status feedback, inline alert, progress stepper, actionable empty state |
| Media and data | Image comparison, lightbox, searchable sortable records, category filters |

Each element has authored markup and a finite kind. Temporary visitor state
(search, tabs, form values, notification dismissal, quantity, task progress and
tags) remains inside the frame. It never changes saved project data or JEV state.
Account and order interfaces demonstrate frontend behavior; they do not provide
authentication, billing or payment processing. Guided inquiry prepares an email
draft using the validated public brand address.

## Styles and examples

Swiss Editorial, Warm Paper, Quiet Luxury, Botanical, Industrial, Neo-Brutalist,
Soft Product, Dark Studio, Frosted Glass, Playful Pastel, Technical Mono and Gallery
Minimal coordinate local colors, typography, spacing, shapes and control surfaces.
Styles respect locked design settings; manual controls can override preset values.
Frosted Glass has an opaque fallback. No remote fonts or runtime packages load.
The generated-site system is recorded in [generated-ui/DESIGN.md](generated-ui/DESIGN.md),
separately from the editor's existing Drawing Office design system.

Architecture studio, software product, photography portfolio, boutique stay,
creative agency, product storefront, analytics workspace and project management
examples use ordinary editable catalog entries. Their additional pages demonstrate
all 12 styles; together their primary pages contain all 24 reusable elements.
Example names, quotes, people, logos and statistics remain prepared draft content.
Replace examples and verify claims before publishing.

## Persistence and composition

Schema version 2 allows multiple body sections of one family. Section IDs remain
unique; navigation, hero/application and footer remain single anchored families.
The limits remain eight pages, twelve sections per page and eight items per section.
Schema version 1 inputs normalize into version 2 with empty element collections
and the individual-settings style. Migration is in memory until the next save;
existing copy, links, images, locks, placements and IDs are preserved.

The two JEV passes select finite catalog IDs, styles and prepared element kinds.
Questions address repeated sections by identity. On dense pages, canvas choices
retain section-level owners and prioritize details in the selected section. Larger pages use coordinated
presentation recipes for nonselected sections when detailed choices would exceed
160 questions. Each question remains limited to 255 choices. Exact quoted text
has explicit identity-bound targets; the model does not supply markup or code.
No provider request is needed for browsing, examples, manual editing or export.

## Reference assessment and licenses

The 60 new blocks, 24 elements, styles and examples are **Forma original · MIT**.
Reference labels identify interaction/design references, not copied source or a
claim that an entire upstream library is installed. The previous five adaptations
retain pinned source provenance in `INTERACTION-SOURCES.json` and their MIT notices.

| Reference | Native use or assessment | License boundary |
| --- | --- | --- |
| [Fancy Components](https://www.fancycomponents.dev/) | Expressive transitions, fullscreen navigation and layered imagery | Previous adaptations retain MIT notices |
| [Watermelon UI](https://ui.watermelon.sh/free/animated-react-components) | Stateful product tours, selectors and pricing | Previous adaptations retain MIT notices |
| [useLayouts](https://uselayouts.com/) | Galleries, albums and focused collection navigation | Previous adaptations retain MIT notices |
| [Cult UI](https://www.cult-ui.com/) | Disclosures and locally drawn device frames | Previous adaptations retain MIT notices |
| [Velora UI](https://github.com/ColorlibHQ/velora-ui) | Navigation, comparisons and motion with static fallbacks | Previous adaptations retain MIT notices |
| [Motion Primitives](https://github.com/itsjwill/motion-primitives-website) | Motion vocabulary and activity layouts; implemented locally | No source copied; README license claims alone do not authorize future extraction |
| [Animate UI](https://animate-ui.com/) | Accessible practical panels and disclosures | No source copied; verify exact component notice before future extraction |
| [Spectrum UI](https://github.com/arihantcodes/spectrum-ui) | Structured comparison patterns | Repository uses Apache-2.0; do not relabel upstream code MIT |
| [PioneerUI](https://www.pioneerui.com/) | Presentation and connected process patterns | No source copied; verify exact component license before extraction |
| [UI Components](https://www.uicomponents.dev/) | Community gallery/viewer patterns | No source copied; verify each contributed component before extraction |

## Extension contract

Add a block through `expansion.mjs`/`catalog.mjs`, prepared content,
`expansion-render.mjs`, local CSS/runtime behavior, accurate part/media controls,
translation inventory and tests. Add an element through `widgets.mjs`, shared and
request validation, the renderer, bounded runtime behavior and tests. Keep runtime
state separate from saved values. Never add dependencies, remote component fetches,
arbitrary markup, dynamic script evaluation or a weaker preview CSP.

All authored content remains readable without JavaScript. Inspect reveals hidden
panels and disclosures for editing. Interactive state returns when switching back
to Interact. Reduced motion suppresses decorative motion while leaving functional
tabs, filters, sliders, dialogs and form steps usable.

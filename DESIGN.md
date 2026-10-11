---
name: Forma Editor
description: The Drawing Office, an architect's sheet set for a local-first website builder
colors:
  bg-0: "#0e1216"
  bg-1: "#141a20"
  bg-2: "#1a222a"
  bg-3: "#212b34"
  sheet: "#faf9f6"
  issue-bg: "#ece6d6"
  issue-ink: "#141a20"
  text-1: "#eef2f4"
  text-2: "#b6c2cc"
  text-3: "#7f8e9a"
  text-4: "#56646f"
  line: "#243039"
  line-strong: "#33424e"
  accent: "#4cc3e6"
  accent-hover: "#6fd0ec"
  accent-ink: "#07161d"
  accent-soft: "rgba(76,195,230,.14)"
  accent-line: "rgba(76,195,230,.42)"
  rev: "#e0a62b"
  rev-soft: "rgba(224,166,43,.14)"
  rev-line: "rgba(224,166,43,.42)"
  danger: "#ef6f6c"
  danger-soft: "rgba(239,111,108,.12)"
  danger-line: "rgba(239,111,108,.42)"
  ok: "#7ccf8a"
  ok-soft: "rgba(124,207,138,.14)"
  grid-minor: "rgba(76,195,230,.05)"
  grid-major: "rgba(76,195,230,.11)"
  scrim: "rgba(8,11,14,.72)"
  light-bg-0: "#e4dfd1"
  light-bg-1: "#f3f0e7"
  light-bg-2: "#fbf9f3"
  light-bg-3: "#e9e4d7"
  light-sheet: "#ffffff"
  light-issue-bg: "#151d25"
  light-issue-ink: "#f3f0e7"
  light-text-1: "#151d25"
  light-text-2: "#3c4954"
  light-text-3: "#5f6c77"
  light-text-4: "#98a3ab"
  light-line: "#d6cfbe"
  light-line-strong: "#beb6a3"
  light-accent: "#0a7599"
  light-accent-hover: "#086381"
  light-accent-ink: "#ffffff"
  light-accent-soft: "rgba(10,117,153,.12)"
  light-accent-line: "rgba(10,117,153,.45)"
  light-rev: "#8f6209"
  light-rev-soft: "rgba(143,98,9,.12)"
  light-rev-line: "rgba(143,98,9,.4)"
  light-danger: "#b5322f"
  light-danger-soft: "rgba(181,50,47,.1)"
  light-danger-line: "rgba(181,50,47,.4)"
  light-ok: "#2b7a40"
  light-ok-soft: "rgba(43,122,64,.12)"
  light-grid-minor: "rgba(10,117,153,.07)"
  light-grid-major: "rgba(10,117,153,.14)"
  light-scrim: "rgba(40,34,20,.55)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-secondary:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  control:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "ui-monospace, Cascadia Mono, SF Mono, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.09em"
  measure:
    fontFamily: "ui-monospace, Cascadia Mono, SF Mono, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
    fontFeature: "tnum"
  wordmark:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.03em"
rounded:
  hair: "1px"
  sheet: "2px"
  chip: "3px"
  control: "4px"
  dialog: "6px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  3xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-build:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
    height: "40px"
    width: "100%"
  button-issue:
    backgroundColor: "{colors.issue-bg}"
    textColor: "{colors.issue-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "34px"
  button-secondary:
    backgroundColor: "{colors.bg-2}"
    textColor: "{colors.text-1}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "34px"
  button-secondary-hover:
    backgroundColor: "{colors.bg-3}"
  button-small:
    padding: "4px 9px"
    height: "28px"
  button-danger-text:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "34px"
  icon-button:
    textColor: "{colors.text-3}"
    rounded: "{rounded.control}"
    size: "32px"
  icon-button-hover:
    backgroundColor: "{colors.bg-3}"
    textColor: "{colors.text-1}"
  icon-button-pressed:
    backgroundColor: "{colors.rev-soft}"
    textColor: "{colors.rev}"
  input:
    backgroundColor: "{colors.bg-2}"
    textColor: "{colors.text-1}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  card:
    backgroundColor: "{colors.bg-2}"
    rounded: "{rounded.control}"
    padding: "12px"
  panel:
    backgroundColor: "{colors.bg-1}"
    textColor: "{colors.text-1}"
  tab-count-chip:
    textColor: "{colors.text-3}"
    typography: "{typography.measure}"
    rounded: "{rounded.chip}"
    padding: "3px 5px"
  status-slug:
    textColor: "{colors.text-3}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "5px 7px"
  layer-row-active:
    backgroundColor: "{colors.accent-soft}"
    rounded: "{rounded.control}"
    padding: "5px 4px"
  palette-swatch:
    backgroundColor: "{colors.bg-2}"
    rounded: "{rounded.control}"
    padding: "5px"
  toast:
    backgroundColor: "{colors.bg-1}"
    textColor: "{colors.text-1}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "11px 14px 11px 16px"
  dialog:
    backgroundColor: "{colors.bg-1}"
    textColor: "{colors.text-1}"
    rounded: "{rounded.dialog}"
    padding: "24px"
    width: "480px"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
---

# Design System: Forma Editor

## Overview

**Creative North Star: "The Drawing Office"**

The editor is an architect's sheet set. The workspace is a deep navy-black pasteboard ruled with a faint drafting grid, and the website under construction sits on it as a lit sheet with corner ticks and a monospaced slug line reading its width and zoom. Everything around the sheet is a title block: the header, the panel tabs, the toolbars and the footers are 56px, 44px and 32px strips divided by 1px hairlines into cells, never floating cards. Left of the sheet are the request notes (the brief), right of it the layer palette (the inspector); JEV requests are revisions, recorded in the Decisions tab as a from-to change log.

Colour is used the way ink is used on a drawing. One drafting cyan marks what is live: the selection, the active tab's underline, focus, the caret, the primary Build action. Revision ochre marks what is held: locks, pressed toggles, draft copy, offline demo mode, warnings. Vellum is the issued sheet, worn by the single inverted Export button. The neutrals are four steps of one cool navy, four text tones and two hairlines; there are no other greys. A derived light theme, toggled through `html[data-theme="light"]` and remembered in localStorage as `forma:theme`, swaps the board for warm parchment and deepens the cyan to a printable teal without changing a single rule.

Density is compact and legible: 13px body, 12px help, 11px monospaced measurements, headings at 650 weight with negative tracking. The system sans serves every reading role; monospace appears only where a draughtsman would letter by hand, in measurements, filenames, counts and slugs. Motion is one 160ms ease on state change plus a single authored animation, the border drafted around the loader mark while JEV works. The build refuses the dark-SaaS editor it could have been: no glow, no rounded-card chrome, no scattered greys, no icon fonts, no remote fonts, no CDN. Every visible string exists in nine languages, so every control wraps or ellipsizes rather than assuming English widths.

**Key Characteristics:**
- Dark-first navy-black board with a 24px minor / 120px major drafting grid; a derived warm-parchment light theme under `html[data-theme="light"]`.
- One chromatic accent for live state (drafting cyan), one for held state (revision ochre), one inverted surface for issuing (vellum).
- Hairline title-block construction: 1px rules, square chrome, 4px controls, 6px dialogs, 2px sheet, 1px-radius square dots.
- System font stacks only; monospace reserved for measure, filename, count, timestamp and uppercase slug.
- Compact 11/12/13/15/18/22px ramp with 650-weight, negatively tracked headings and `text-wrap: balance`.
- Flat tonal layering; shadows only under things that physically float above the board.
- Stroke icon set (24 viewBox, 1.6 stroke, round caps) inlined from `shared/icons.mjs`; the crane is the mark, its block filled cyan.

## Colors

One cool navy family in four steps, four text tones and two hairlines, with a single cyan ink for what is live, an ochre for what is held and a vellum sheet for what is issued; the light theme is the same drawing on parchment.

### Primary
- **Drafting Cyan** (`accent`, #4cc3e6; on parchment #0a7599): the live ink. Primary button fill, the 2px active-tab underline, focus outlines, the text caret, the live dot in the canvas caption, the active device icon, the active layer's index, the hover colour of text buttons and help questions, the change arrow in the Decisions log, and the crane block in the mark.
- **Cyan Hover** (`accent-hover`, #6fd0ec; on parchment #086381): primary button hover only.
- **Cyan Ink** (`accent-ink`, #07161d; on parchment #ffffff): text and icons on a cyan fill, and the bar across the crane block.
- **Cyan Wash and Cyan Line** (`accent-soft` at 14%, `accent-line` at 42%; 12% and 45% on parchment): the only way cyan reaches a surface. Selected layer rows, the selection-context note, picked-up grips, the pressed Inspect toggle, the active project card, the input focus halo, the drag-preview border, and the corner ticks framing the sheet.
- **Grid** (`grid-minor` at 5%, `grid-major` at 11% cyan; 7% and 14% on parchment): the drafting grid drawn on the pasteboard.

### Secondary
- **Revision Ochre** (`rev`, #e0a62b; on parchment #8f6209), with **Ochre Wash** (`rev-soft`, 14%) and **Ochre Line** (`rev-line`, 42%): the held state. Pressed and active icon buttons, locked layers and locked design settings, draft-copy notes, the offline-demo mode note, export report warnings, and the marker on the cookie notice.

### Tertiary
- **Correction Red** (`danger`, #ef6f6c; on parchment #b5322f), with `danger-soft` (12%) and `danger-line` (42%): failed activity entries and their hairline, error toasts, error feedback, and the danger-text buttons (Cancel request, Delete page).
- **Approval Green** (`ok`, #7ccf8a; on parchment #2b7a40), with `ok-soft` (14%): the verified connection dot and its 3px halo, success toasts, positive feedback, and a draft note once it has been reviewed.

### Neutral
- **Pasteboard** (`bg-0`, #0e1216; on parchment #e4dfd1): the board behind the sheet, the body background, and the halo that separates the insertion marker from whatever it crosses.
- **Title Block** (`bg-1`, #141a20; on parchment #f3f0e7): header, side panels, toolbars, footers, dialogs, toasts, menus, the code view, and inputs nested inside a card.
- **Raised Control** (`bg-2`, #1a222a; on parchment #fbf9f3): buttons, inputs, selects, cards, grips, swatches, the mark's square and the device-switch well.
- **Hover Lift** (`bg-3`, #212b34; on parchment #e9e4d7): hover fill on controls and rows, the active preview and device tab, and the icon well inside a library card.
- **Sheet** (`sheet`, #faf9f6; on parchment #ffffff): the preview shell and iframe background while the site loads.
- **Vellum** (`issue-bg`, #ece6d6; on parchment #151d25) and **Vellum Ink** (`issue-ink`, #141a20; on parchment #f3f0e7): the Export button, and nothing else.
- **Text 1 to 4** (`text-1` #eef2f4, `text-2` #b6c2cc, `text-3` #7f8e9a, `text-4` #56646f; on parchment #151d25, #3c4954, #5f6c77, #98a3ab): headings, values and active labels; body copy, secondary labels and card text; help text, placeholders, slugs and resting icons; layer indices, struck-through previous values, the resting connection dot and hover borders.
- **Hairline and Strong Hairline** (`line` #243039, `line-strong` #33424e; on parchment #d6cfbe, #beb6a3): panel and cell dividers, card and row edges, list rules; control borders, menu and dialog edges, scrollbar thumbs, dashed drop targets.
- **Scrim** (`scrim`, rgba(8,11,14,.72); on parchment rgba(40,34,20,.55)): behind dialogs and the busy overlay, always with a 3px backdrop blur.

The light theme redefines every token under `html[data-theme="light"]` and flips `color-scheme`; no selector changes and no value is hard-coded outside the token block except the selection highlight (rgba(10,117,153,.22)) and the reviewed-note border (rgba(43,122,64,.45)).

### Named Rules
**The One Ink Rule.** Drafting cyan is the only colour that means "live": the selection, the active tab's 2px underline, focus rings, the caret, the live dot, the Inspect toggle and the primary button. No second decorative accent exists; if everything were cyan, nothing would be selected.
**The Revision Ochre Rule.** Ochre means held, pending or unreviewed: locked layers, pressed toggles, draft-copy notes, offline demo mode, report warnings. It never colours an action and never decorates.
**The Wash-and-Line Rule.** A status colour reaches a surface only as a 10 to 14% wash behind a 40 to 45% line of the same hue (`accent-soft` with `accent-line`, `rev-soft` with `rev-line`, `danger-soft` with `danger-line`). Solid fills are reserved for the primary button, 2px markers and 5 to 7px square dots.
**The Vellum Issue Rule.** Export is the one control that inverts the theme: vellum on the dark board, an ink block on parchment. Nothing else may use the `issue-bg` and `issue-ink` pair.

## Typography

**Display Font:** ui-sans-serif system stack (system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial); the same stack serves every reading role
**Body Font:** the same ui-sans-serif stack
**Label/Mono Font:** ui-monospace stack ("Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono")

**Character:** One system sans, set tight and medium-heavy at heading sizes (650 weight, negative tracking, balanced wrapping) and plain at body, with `font-synthesis: none` so no faux weights appear. Monospace is the draughtsman's lettering: small, tabular, tracked open when uppercase.

### Hierarchy
- **Display** (650, 22px / 1.375rem, 1.2, -.02em): the brief heading "Express your ideas. Let JEV help" and dialog titles, always `text-wrap: balance`. Grows to 24px on the single-pane layout; dialog titles fall to 20px under 570px.
- **Headline** (650, 18px / 1.125rem, 1.25, -.015em): the Components and Past projects intros and the empty Decisions state; the busy card heading sits at 20px.
- **Title** (650, 15px / .9375rem, 1.3, -.01em): Content-tab block headings. Inspector group headings and the Decisions result heading use the same weight at 13px.
- **Body** (400, 13px / .8125rem, 1.5): controls, prompt text, notes and dialog descriptions (1.6). Intro copy is capped at 32ch (36ch on wide screens).
- **Secondary** (400, 12px / .75rem, 1.6): help text, guidance, card captions, list rows, breadcrumbs. Field labels are the same size at 600 with .01em tracking; row names at 500.
- **Control** (500, 13px, 1.3): button labels and panel tabs; 600 for the active tab, the Build button and `strong`.
- **Label** (mono 500, 11px / .6875rem, 1.4, .09em, uppercase): micro-labels, library group slugs, the canvas caption, help topic heads, the code-view heading; card headers track at .07em, the page toolbar label at .08em, the status slug at .06em.
- **Measure** (mono 400 or 500, 11px, `tabular-nums`): counts, the prompt counter, page address, canvas width and zoom, layer indices, timestamps, decision values and both footers; report metrics are mono 500 at 18px; code at 12px/1.7.
- **Wordmark** (650, 19px / 1.1875rem, 1, -.03em): "forma" with an accent-coloured full stop; 17px under 570px.

### Named Rules
**The Mono-for-Measure Rule.** Monospace is only for what a draughtsman letters by hand: measurements, filenames, counts, timestamps, slugs and uppercase micro-labels. Body copy, headings and button labels never use it.
**The Slug Line Rule.** A mono uppercase micro-label is a slug that heads its own group, drawn with a trailing hairline (`A LITTLE INSPIRATION`, library group titles), captions the sheet, or headers a card; in the Decisions record it follows the heading as a provenance line.
**The Long-Label Rule.** Every string ships in nine locales. Labels wrap (`overflow-wrap: anywhere`, `white-space: normal` on buttons) or ellipsize behind an explicit max-width (project title 260px, layer variant 130px); tab strips scroll sideways rather than clip.

## Layout

The workspace is a fixed three-pane grid on a 100dvh flex column: header, then `300px | minmax(360px, 1fr) | 300px` (brief, canvas, inspector). At 1600px and wider the panes open to `330px | minmax(520px, 1fr) | 320px`; at 1200px and narrower they tighten to `270px | minmax(320px, 1fr) | 262px` and the status slug and page address hide. At 950px and narrower the grid collapses to one pane at a time, chosen by `data-panel` on the workspace through a 44px Build / Preview / Edit switcher under the header; pane content centres at `min(560px, 100%)`. At 650px the header actions wrap onto a second hairline-ruled row; at 570px the project title and New button hide, the wordmark drops to 17px and the mark to 28px. Coarse pointers get 44px grips and 44px menu and outline rows.

Vertical strips carry fixed heights: header 56px (`--header-h`), panel tabs, canvas toolbar and mobile switcher 44px (`--tabs-h`), canvas footer 32px, the local-storage note 60px minimum, the page toolbar 6px 16px padding. Every strip is `bg-1` with a 1px `line` on its dividing edge, and every side panel meets the canvas with the same hairline.

Panel padding is 22px 20px 28px in the brief (26/24/32 wide, 20/16/26 tight) and 20px 18px 28px in the inspector. Inside: inspector groups 24px apart, setting rows 14px, editor fields 12px, cards 8px, list entries 6px, layer rows 2px, control gaps 6 to 8px. Grids are two or three columns with 7 to 10px gaps: palette 3-col at 8px, starters 2-col (4-col on the single pane, 2-col under 570px), icon grid 2-col at 7px, report metrics 2-col, paired settings 2-col at 10px. The Build button is `position: sticky; bottom: 0` with a `bg-1` halo shadow so the brief scrolls beneath it.

The canvas area pads 16px 24px and draws the drafting grid as four repeating 1px gradients (24px minor, 120px major, anchored centre top). A 20px caption row holds a 6px square live dot and the mono width and zoom readout right-aligned. The sheet frame is centred, framed by eight 14x1px cyan-line corner ticks at a 9px inset, and holds the scaled preview iframe (transform-origin top left). The HTML view replaces the sheet with a full-height `bg-1` ruled panel and a sticky mono heading.

### Named Rules
**The Title-Block Rule.** Every region is a cell: header, tabs, toolbars, footers and panel edges are separated by 1px `line` hairlines on square-cornered `bg-1`. Chrome never floats, never rounds and never casts a shadow.
**The 44px Strip Rule.** Tab rows, toolbars and the mobile switcher are 44px; the header is 56px; the canvas footer is 32px. A new strip takes one of these heights and its dividing hairline.

## Elevation & Depth

Depth is tonal first: pasteboard (`bg-0`) under title block (`bg-1`) under raised control (`bg-2`) under hover lift (`bg-3`), with hairlines marking every edge. Shadows appear only under what physically lies above the board: the sheet, and anything that floats (menus, dialogs, toasts, drag ghosts, the busy card, the help button). Selection and focus are crisp rings and washes, never a blurred glow; the only blur in the system is the 3px backdrop blur behind scrims.

### Shadow Vocabulary
- **Sheet lift** (`--shadow-1`: `0 1px 2px rgba(0,0,0,.35), 0 10px 24px -10px rgba(0,0,0,.55)`; on parchment `rgba(30,25,10,.12)` and `.22`): the preview sheet resting on the board, and the help button.
- **Floating layer** (`--shadow-2`: `0 2px 6px rgba(0,0,0,.4), 0 28px 56px -18px rgba(0,0,0,.65)`; on parchment `.14` and `.3`): dialogs, structure menus, toasts, drag feedback, the busy card, the cookie notice.
- **Pressed ring** (`inset 0 0 0 1px var(--rev-line)`, or `var(--accent-line)` for the Inspect toggle): pressed icon buttons and locked controls.
- **Focus halo** (`0 0 0 3px var(--accent-soft)` with an `accent` border on inputs; `2px solid var(--accent)` outline at 2px offset on buttons, links and summaries).
- **Selection ring** (`0 0 0 1px var(--accent)` on the active swatch; `0 0 0 2px var(--accent-soft)` on the selected editor card; `0 0 0 3px var(--ok-soft)` around the verified dot).
- **Scrim** (`var(--scrim)` plus `backdrop-filter: blur(3px)`): dialog backdrops and the busy overlay; while a new design is pending the overlay is opaque `bg-0` with no blur and the sheet drops its shadow.

### Named Rules
**The Board-and-Sheet Rule.** Only what lies on top of the board casts a shadow: the sheet, and anything that floats (menus, dialogs, toasts, drag ghosts). Panels, cards, buttons and inputs are flat and stay flat on hover.
**The Ring-Not-Glow Rule.** State is shown with a crisp ring or wash (an inset 1px line, a 0 0 0 2 to 3px wash), never a blurred coloured glow.

## Shapes

Chrome is square. Controls, cards, inputs, menus and toasts share the 4px control radius (`--radius`); dialogs and the busy card step up to 6px (`--radius-lg`); small chips, count badges, breadcrumbs, device buttons, history rows, menu rows and image thumbnails sit at 3px; the sheet and swatch previews at 2px; dots and the insertion marker at 1px. Status dots are squares, 5 to 7px with a 1px radius: the connection dot, the live dot, the toast and cookie markers, the insertion cap, the 16x7px palette bars. Borders are always 1px and change colour on hover (`text-4`, `accent-line`, `line-strong`), never weight; dashed 1px `line-strong` marks add-affordances and drop targets (Add section, image upload, empty project list). Disclosure chevrons are 7px squares rotated 45 degrees and drawn with 1.5px borders to match the icon stroke; the select chevron is a 10px data-URI SVG in `text-3`. The Decisions heading carries a 5.5x10px upward cyan triangle, the revision delta. Eight 14x1px corner ticks in cyan-line frame the sheet at a 9px inset. Icons are the stroke set from `shared/icons.mjs`: 24 viewBox, 1.6 stroke, round caps and joins, rendered at 13 to 16px in controls and 20 to 22px in the mark and loader; the crane mark sits in a 32px bordered `bg-2` square with its block filled cyan and barred in cyan ink, and the drag grip is a 12x16 six-dot SVG.

### Named Rules
**The Square Dot Rule.** Indicators are squares, 5 to 7px with a 1px radius. Circles appear only inside icons.
**The Four-Pixel Rule.** Controls, cards, inputs, menus and toasts share the 4px radius; dialogs alone step up to 6px; nothing in the chrome exceeds 6px.

## Components

### Buttons
- **Shape:** 4px radius, 1px border, 34px minimum height, 7px 12px padding, 13px/1.3 at 500, 8px gap, 15px icons; labels wrap rather than clip.
- **Primary:** `accent` fill and border with `accent-ink` text; hover `accent-hover`; active nudges 0.5px down. The Build button is the primary at 40px, 600 weight, full width, spark icon left and arrow pushed right, sticky at the bottom of the brief.
- **Issue (Export):** `issue-bg` fill and border with `issue-ink` text; hover brightens 6%.
- **Secondary (default):** `bg-2` with a `line-strong` border and `text-1`; hover `bg-3` with a `text-4` border. The inspector's Save checkpoint is this at 32px in `text-2`.
- **Small:** 28px, 4px 9px, 12px text, 13px icons (page toolbar, Copy HTML, cookie Accept).
- **Danger text:** transparent with `danger` text and a `danger-line` border; hover `danger-soft` fill and `danger` border.
- **Text button:** inline, 4px 0, `text-2`, hover `accent`; used for Project JSON and small inline actions.
- **Icon button:** 32x32 (30 in toolbars, 24 to 26 inside rows and headings), 16px icon, `text-3`; hover `bg-3` and `text-1`; pressed or active (`aria-pressed`, `.active`, `.locked`) `rev-soft` fill, `rev` icon, inset `rev-line` ring.
- **Connection button:** the secondary at 12px in `text-2` with a 7px square dot in `text-4`; verified turns the label `text-1` and the dot `ok` with a 3px `ok-soft` halo.
- **Disabled and focus:** disabled at 42% opacity with `not-allowed`; focus-visible draws a 2px `accent` outline at 2px offset.

### Chips
- **Count chip** (tab counts): mono 11px at 500, `text-3`, 1px `line-strong`, 3px radius, 3px 5px padding (2px 4px in the brief tabs).
- **Status slug** (Sample canvas, Saved): mono 11px at 500 uppercase with .06em tracking, `text-3`, 1px `line`, 3px radius, 5px 7px padding; hidden at 1200px and below.
- **Breadcrumb and part choice:** 30px, 12px text, `bg-2` with `line-strong`, 3px radius, 5px 8px; hover `text-4` border; current or pressed `accent-soft` with an `accent-line` border and `text-1`.

### Cards / Containers
- **Corner Style:** 4px; history rows and the item-context button at 3px.
- **Background:** `bg-2` on `bg-1` panels; inputs nested inside an editor card drop to `bg-1` so the card still reads as raised.
- **Border:** 1px `line`; hover `accent-line` (library cards, history rows, image upload) or `line-strong` (project cards); selected editor card `accent-line` plus a 2px `accent-soft` ring; active project card `accent-soft` fill.
- **Shadow Strategy:** none at rest or on hover (Board-and-Sheet Rule).
- **Internal Padding:** 12px (editor card, interface controls, image-size fieldset), 14px (request result, export review), 9px 10px (library card, history row), 11px 12px (report metric), 12px with 10 to 12px gaps (project card).
- **Notes:** the operation note is `bg-2` with a `line` border; the selection-context note is `accent-soft` with `accent-line`; draft notes, the demo-mode note and report warnings are `rev-soft` with `rev-line` in `rev`; a reviewed draft note turns `ok-soft` with `ok`. All are 12px/1.6 with 9 to 11px by 11 to 12px padding and the 4px radius.

### Inputs / Fields
- **Style:** 1px `line-strong`, `bg-2`, 4px radius, 8px 10px, 13px/1.45; placeholder `text-3`; caret `accent`; textareas resize vertically; the prompt is 128px minimum at 11px 12px padding and 1.6 leading. Inputs grow to 14px on the single-pane layout.
- **Select:** native appearance removed, 28px right padding, the 10px data-URI chevron at `right 10px center`, options on `bg-1`; the language select is 54px wide with its text hidden behind a 20x14px SVG flag.
- **Focus:** border `accent` with a `0 0 0 3px accent-soft` halo and no outline.
- **Labels and help:** 12px at 600 in `text-2` above (6px gap, wraps anywhere); help 12px/1.6 in `text-3` below (8px; 6px inside settings); feedback 12px at 500 in `ok`, `.error` in `danger`, hidden when empty.
- **Checkbox:** native at 14px with `accent-color: accent`, aligned 3px down from the label's first line.
- **Error / Disabled:** selects 50% opacity, fieldsets 60%, both `not-allowed`; the image upload is a dashed `line-strong` label with a 52x40px thumbnail at 3px.

### Navigation
- **Panel tabs:** a 44px strip with 20px gutters and gaps (12px and 10px in the brief panel); 13px at 500 in `text-3`; hover `text-1`; active `text-1` at 600 with a 2px `accent` underline sitting on the strip's bottom hairline; count chips follow the label; the strip scrolls horizontally, scrollbar hidden, when a locale overflows.
- **Preview and device tabs:** 3px-radius pills at 12px 500, `text-3`; hover and active `bg-3` with `text-1`; the three device buttons (30x26) sit in a 2px-padded `bg-2` well with a `line` border and the active device icon turns `accent`; the Inspect toggle uses `accent-soft` with an inset `accent-line` ring when on.
- **Mobile switcher:** three equal cells with 1px `line` dividers, 13px at 500, the same 2px active underline.
- **Header:** a 56px title block of three hairline-divided cells: identity (32px crane mark and the wordmark), project (globe icon, ellipsized title, status slug), actions (language flag select, theme, projects and new icon buttons, the connection button, the vellum Export button).

### Layer Row (signature)
The inspector's section list is a rigid row grid: grip, index, name and variant, controls, 2px between rows. A row has a transparent 1px border and the 4px radius at 5px 4px padding; hover fills `bg-2`; the active row fills `accent-soft` with an `accent-line` border and its mono index turns `accent`. The index is mono 11px in `text-4`, the name 12px at 500 in `text-1`, the variant 11px in `text-3` ellipsized at 130px. Row controls rest at 40% opacity and reach full opacity on hover, focus-within or active; a locked control is ochre (`rev-soft`, `rev`, inset `rev-line`). Grips are 30x34px bordered `bg-2` squares with the six-dot SVG and `cursor: grab`; picked up they turn `accent-soft` with an `accent` border. The insertion marker is a fixed 2px `accent` line with an 8px square cap, haloed 2px in `bg-0`. The Move menu is a 230px `bg-1` sheet at `--shadow-2` with 34px rows at 3px radius, its destination row `accent-soft` with a 1px inset `accent` outline. Add section is a dashed `line-strong` full-width row that turns `accent-line` on hover.

### Sheet on the Board (signature)
The canvas is the drawing board: `bg-0` under the four-gradient drafting grid, a 20px mono caption row (6px square live dot, "1,200 PX · 66%" right-aligned in `text-3`), and the sheet frame with its eight cyan-line corner ticks. The preview shell is `sheet` white with a 1px `line-strong` outline, 2px radius and `--shadow-1`, clipping a scaled iframe. While JEV works, a scrim with 3px blur covers the board and a 360px `bg-1` busy card at 6px and `--shadow-2` shows a 48px bordered loader square holding the spark icon, around which a 1px cyan border is drafted by a conic mask (`@property --draft-angle`, 1.6s linear, the only looping animation); heading 20px display, message 13px `text-2`, preservation note 12px `text-3`.

### Palette Swatches
A 3-column grid of swatch buttons: `bg-2`, 1px `line`, 4px radius, 5px padding; inside, a 30px preview (26px tight, 40px on the single pane) at 2px radius with a 1px black-15% inner edge holding three 16x7px colour bars at 1px radius; the label is 11px `text-2`, ellipsized. Hover borders `text-4`; the active swatch borders `accent` with a 1px `accent` ring and its label turns `text-1`.

### Dialogs, Menus and Toasts
Dialogs are `bg-1` with a 1px `line-strong` border, 6px radius, 24px padding, 480px wide (640px wide variant, 660px help), `--shadow-2` over the scrim; a 22px display title with an icon close button at the top right, a 13px `text-2` description, and right-aligned actions with an 8px gap. Toasts stack bottom-centre at up to 440px: `bg-1`, `line-strong`, 4px, `--shadow-2`, 13px, with a 5px square `accent` marker at the left (border and marker turn `danger-line`/`danger` or green for error and success). Menus follow the Layer Row's Move menu. The help button is a fixed 44px bordered `bg-1` square at `--shadow-1` whose border and glyph turn `accent` on hover.

### Placeholder Plates (generated-site boundary)
When a site image is missing, `shared/render.mjs` renders one of four inline-SVG landscape scenes (`ART_PLATES`): a ridge at dusk under a low sun, dunes under a crescent moon, a sea horizon with a broken sun reflection, and a misty pine forest. Each is coloured entirely from the generated site's palette through the `.sc-*` rules in `public/site.css`: `themeCss` emits `--art-deep` and `--art-light` (the darker and lighter of background and ink) plus `--art-sky-top` and `--art-sky-mid`, so the sky reads light in light palettes and as night in dark ones while silhouettes always step from haze to near-ink. A 6% noise overlay (`.art:after`) keeps the print texture. No caption is drawn. The scenes are authored fallbacks, never JEV output.

## Do's and Don'ts

### Do:
- **Do** build every new region as a title-block cell: `bg-1`, square corners, a 1px `line` on the shared edge, and 44px for any strip.
- **Do** use `accent` only for live state and the primary action, `rev` only for held, pending or draft state, and reach surfaces through the `*-soft` wash behind the `*-line` border.
- **Do** set headings at 650 with negative tracking (-.02em at 22px, -.015em at 18px, -.01em at 15px) and `text-wrap: balance`, and keep body at 13px/1.5 and help at 12px/1.6.
- **Do** letter measurements, counts, filenames, timestamps and slugs in the mono stack with `tabular-nums`; uppercase slugs take .06em to .09em tracking.
- **Do** transition only `background`, `border-color`, `color`, `opacity` and `transform` at 160ms `cubic-bezier(.2,.7,.2,1)`, and remove every animation and transition under `prefers-reduced-motion: reduce`.
- **Do** let labels wrap or ellipsize behind an explicit max-width, and check the widest of the nine locales before fixing a control's width.
- **Do** inline icons from `shared/icons.mjs` (24 viewBox, 1.6 stroke, round caps) at 13 to 16px in controls, and give coarse pointers 44px grips and rows.
- **Do** redefine any new token under `html[data-theme="light"]` in the same change; the light theme is derived from the dark one, not designed apart from it.

### Don't:
- **Don't** add a blurred coloured glow or a shadow to a resting panel, card, button or input; only the sheet and floating layers carry `--shadow-1` or `--shadow-2`.
- **Don't** blend colours with gradients; the only gradients in the system draw the 1px grid lines, the corner ticks and the loader's conic mask.
- **Don't** round chrome: panels, toolbars, headers and footers stay square, and nothing in the editor exceeds the 6px dialog radius.
- **Don't** introduce a fifth surface step or a fifth text tone; the four `bg-*` steps, four `text-*` tones and two hairlines are the complete neutral set.
- **Don't** load a font, icon font, script or image from outside the app; the CSP allows only `'self'` and `data:` images, so chevrons are data URIs and icons are inline SVG.
- **Don't** use a circle as a status indicator or thicken a border to show state; dots are 1px-radius squares and borders stay 1px and change colour.
- **Don't** apply the editor tokens to the generated website, or record its per-project palettes (Porcelain, Midnight, Sage, Ocean, Clay, Monochrome in the Color story grid) as editor colours; that is a separate system chosen by the user's JEV choices.

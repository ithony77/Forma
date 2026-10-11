/* Native adaptations of Fancy Components, Watermelon UI, useLayouts, Cult UI and
 * Velora UI. MIT notices are embedded in this document and included in exports.
 * Only fixed, renderer-authored selectors are used. No project code is executed. */
(() => {
  const site = document.querySelector('.site');
  if (!site) return;
  const lifetime = new AbortController(), cleanups = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 700px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const inspecting = () => document.body.dataset.preview === 'true' && document.body.dataset.editMode !== 'false';
  const moving = () => !inspecting() && !reduced.matches && !site.classList.contains('motion-none');
  const expressive = () => moving() && site.classList.contains('motion-expressive');
  const on = (target, event, handler, options = {}) => target.addEventListener(event, handler, { ...options, signal: lifetime.signal });
  const resync = [];

  // Pointer work is scheduled once per frame and never starts on touch devices.
  for (const section of site.querySelectorAll('.features-spotlight, [data-element-card-interaction="spotlight"]')) {
    if (section.dataset.elementCardInteraction === 'none' || section.dataset.elementCardInteraction === 'lift') continue;
    for (const card of section.querySelectorAll('.feature-card, .service-card, .gallery-card, .pricing-card, .process-grid > li')) {
      let frame = 0, point;
      const reset = () => { cancelAnimationFrame(frame); frame = 0; card.removeAttribute('data-spotlight-active'); card.style.removeProperty('--spot-x'); card.style.removeProperty('--spot-y'); };
      on(card, 'pointermove', (event) => {
        if (!moving() || !fine.matches || event.pointerType === 'touch') return;
        point = { x: event.clientX, y: event.clientY };
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!moving()) return reset();
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--spot-x', `${Math.round(point.x - rect.left)}px`);
          card.style.setProperty('--spot-y', `${Math.round(point.y - rect.top)}px`);
          card.dataset.spotlightActive = 'true';
        });
      }, { passive: true });
      on(card, 'pointerleave', reset);
      resync.push(reset); cleanups.push(reset);
    }
  }

  for (const disclosure of site.querySelectorAll('.service-disclosure')) {
    let savedOpen = disclosure.open, wasInspecting = false;
    resync.push(() => {
      if (inspecting() && !wasInspecting) { savedOpen = disclosure.open; disclosure.open = true; }
      if (!inspecting() && wasInspecting) disclosure.open = savedOpen;
      wasInspecting = inspecting();
    });
  }

  for (const track of site.querySelectorAll('[data-gallery-track]')) {
    const cards = [...track.querySelectorAll('[data-gallery-item]')];
    const section = track.closest('.site-section'), controls = section.querySelector('.gallery-controls');
    const position = controls?.querySelector('.gallery-position');
    const stack = track.dataset.galleryTrack === 'stack';
    let active = 0, stacked = false, frame = 0, trackWidth = track.clientWidth, wasInspecting = false;
    const label = () => {
      if (position) position.textContent = `${active + 1} / ${cards.length}`;
      controls?.querySelectorAll('[data-gallery-step]').forEach((button) => {
        button.disabled = cards.length < 2 || (!stack && (Number(button.dataset.galleryStep) < 0 ? active === 0 : active === cards.length - 1));
      });
    };
    const paint = () => {
      cards.forEach((card, index) => {
        const offset = (index - active + cards.length) % cards.length;
        card.style.setProperty('--fan-offset', String(Math.min(offset, 3)));
        card.style.setProperty('--fan-angle', `${offset === 0 ? 0 : offset % 2 ? -5 : 5}deg`);
        card.dataset.galleryActive = String(index === active);
        // Keep inactive links out of the keyboard order only in the enhanced stack.
        card.inert = stacked && index !== active;
        if (stacked && index !== active) card.setAttribute('aria-hidden', 'true'); else card.removeAttribute('aria-hidden');
      });
      label();
    };
    const sync = () => {
      if (!stack && !inspecting() && cards.length && (track.clientWidth !== trackWidth || wasInspecting)) {
        trackWidth = track.clientWidth;
        track.scrollTo({ left: cards[active].offsetLeft - cards[0].offsetLeft, behavior: 'instant' });
      }
      stacked = stack && expressive() && !narrow.matches && cards.length > 1;
      track.dataset.galleryEnhanced = stacked ? 'stack' : 'plain';
      if (controls) controls.hidden = inspecting() || (stack && !stacked) || cards.length < 2;
      track.tabIndex = inspecting() || (stack && !stacked) ? -1 : 0;
      paint();
      wasInspecting = inspecting();
    };
    const go = (step) => {
      if (inspecting() || !cards.length || (stack && !stacked)) return;
      active = stack ? (active + step + cards.length) % cards.length : Math.max(0, Math.min(cards.length - 1, active + step));
      if (!stack) {
        const left = cards[active].offsetLeft - cards[0].offsetLeft;
        track.scrollTo({ left, behavior: moving() ? 'smooth' : 'instant' });
      }
      paint();
    };
    if (controls) on(controls, 'click', (event) => { const button = event.target.closest('[data-gallery-step]'); if (button) go(Number(button.dataset.galleryStep)); });
    on(track, 'keydown', (event) => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || inspecting() || (stack && !stacked)) return;
      event.preventDefault();
      go(event.key === 'Home' ? -active : event.key === 'End' ? cards.length - 1 - active : event.key === 'ArrowLeft' ? -1 : 1);
    });
    if (!stack) on(track, 'scroll', () => {
      if (frame || inspecting()) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (inspecting()) return;
        const left = track.getBoundingClientRect().left;
        const maximum = track.scrollWidth - track.clientWidth;
        // The final card cannot align to the left when the viewport is wider
        // than a card. At the physical end, it is still the final gallery item.
        active = maximum > 0 && track.scrollLeft >= maximum - 2 ? cards.length - 1 : cards.reduce((best, card, index) => Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left) ? index : best, 0);
        label();
      });
    }, { passive: true });
    resync.push(sync); cleanups.push(() => cancelAnimationFrame(frame));
  }

  // Natural heights, rather than a fixed reveal height, preserve long authored copy.
  for (const list of site.querySelectorAll('.process-stacked .process-grid')) {
    const cards = [...list.children];
    const sync = () => {
      const safe = expressive() && !narrow.matches && cards.every((card) => card.getBoundingClientRect().height < innerHeight * .6);
      list.dataset.scrollStack = String(safe);
      cards.forEach((card, index) => card.style.setProperty('--stack-index', String(index)));
    };
    const observer = new ResizeObserver(sync);
    cards.forEach((card) => observer.observe(card));
    resync.push(sync); cleanups.push(() => observer.disconnect());
  }

  for (const tabs of site.querySelectorAll('.ui-tabs[data-tab-style="sliding"]')) {
    const indicator = document.createElement('span');
    indicator.className = 'ui-tab-indicator'; indicator.setAttribute('aria-hidden', 'true'); tabs.prepend(indicator);
    const root = tabs.closest('.app-interface');
    const sync = () => {
      const selected = tabs.querySelector('[role="tab"][aria-selected="true"]');
      if (!selected) return;
      indicator.style.width = `${selected.offsetWidth}px`;
      indicator.style.height = `${selected.offsetHeight}px`;
      indicator.style.transform = `translate(${selected.offsetLeft}px, ${selected.offsetTop}px)`;
      if (root) for (const panel of root.querySelectorAll('[role="tabpanel"]')) panel.hidden = !inspecting() && panel.id !== selected.getAttribute('aria-controls');
    };
    const observer = new MutationObserver(sync);
    observer.observe(tabs, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    const size = new ResizeObserver(sync); size.observe(tabs);
    resync.push(sync); cleanups.push(() => { observer.disconnect(); size.disconnect(); });
  }

  // Content is never hidden awaiting JavaScript or an observer callback.
  let entrances;
  const entered = new WeakSet();
  const syncEntrances = () => {
    entrances?.disconnect();
    site.querySelectorAll('[data-entrance-playing]').forEach((section) => section.removeAttribute('data-entrance-playing'));
    if (!expressive() || !('IntersectionObserver' in window)) return;
    entrances = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting && !entered.has(entry.target)) {
        entered.add(entry.target); entrances.unobserve(entry.target);
        entry.target.dataset.entrancePlaying = entry.target.dataset.elementEntrance;
      }
    }, { threshold: .08 });
    site.querySelectorAll('[data-element-entrance="fade"], [data-element-entrance="rise"]').forEach((section) => { if (!entered.has(section)) entrances.observe(section); });
  };
  resync.push(syncEntrances); cleanups.push(() => entrances?.disconnect());
  const sync = () => resync.forEach((update) => update());
  const mode = new MutationObserver(sync);
  mode.observe(document.body, { attributes: true, attributeFilter: ['data-edit-mode'] });
  for (const query of [reduced, narrow, fine]) { query.addEventListener('change', sync); cleanups.push(() => query.removeEventListener('change', sync)); }
  on(window, 'resize', sync, { passive: true });
  on(window, 'pagehide', (event) => {
    // A page kept in the browser's back/forward cache will resume these listeners.
    if (event.persisted) return;
    lifetime.abort(); mode.disconnect(); cleanups.forEach((cleanup) => cleanup());
  });
  sync();
})();

/* Expanded native controls. All content originates in the validated escaped renderer.
 * This runtime owns only transient view state and introduces no message protocol. */
(() => {
  const site = document.querySelector('.site');
  if (!site) return;
  const lifetime = new AbortController(), signal = lifetime.signal;
  const roots = [...site.querySelectorAll('[data-xp-block],[data-xp-widget]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const disclosures = new WeakMap();
  let activeDialog = null, scrollFrame = 0, marqueeTimer;
  const inspecting = () => document.body.dataset.preview === 'true' && document.body.dataset.editMode !== 'false';
  const rootOf = (node) => node.closest('[data-xp-modal],[data-xp-widget],[data-xp-block]');
  const recordRoot = (node) => rootOf(node) || site;
  const records = (root) => [...root.querySelectorAll('[data-xp-record]')].filter((record) => recordRoot(record) === root);
  const announce = (root, message) => { const region = root.querySelector('[data-xp-status]'); if (region) region.textContent = message; };
  const conceal = (node, hidden) => { node.dataset.xpConcealed = String(hidden); };
  const on = (target, name, callback, options = {}) => target.addEventListener(name, callback, { ...options, signal });
  function filter(root) {
    const term = (root.querySelector('[data-xp-search]')?.value || '').toLocaleLowerCase();
    const category = root.dataset.xpFilter || '';
    let count = 0;
    for (const record of records(root)) {
      const hidden = Boolean(category && record.dataset.xpCategory !== category || term && !record.textContent.toLocaleLowerCase().includes(term));
      conceal(record, hidden); if (!hidden) count++;
    }
    const empty = root.querySelector('[data-xp-empty]');
    if (empty) empty.hidden = count > 0;
    announce(root, `${count} ${count === 1 ? 'entry' : 'entries'} shown.`);
  }
  function activateTab(root, index, focus = false) {
    const tablist = root.querySelector('.xp-tablist');
    if (!tablist) return;
    const buttons = [...tablist.querySelectorAll('[data-xp-action="tab"]')];
    if (!buttons.length) return;
    index = Math.max(0, Math.min(buttons.length - 1, index));
    root.dataset.xpTab = String(index); tablist.setAttribute('role', 'tablist');
    buttons.forEach((button, ordinal) => {
      button.setAttribute('role', 'tab'); button.id ||= `${button.getAttribute('aria-controls')}-tab`;
      button.setAttribute('aria-selected', String(index === ordinal)); button.tabIndex = index === ordinal ? 0 : -1;
      const panel = root.querySelector(`[data-xp-panel="${ordinal}"]`);
      if (panel) { panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id); conceal(panel, ordinal !== index); panel.tabIndex = 0; }
    });
    if (focus) buttons[index].focus();
  }
  function step(root, requested) {
    const wizard = root.matches('[data-xp-wizard]') ? root : root.querySelector('[data-xp-wizard]');
    if (!wizard) return;
    const steps = [...wizard.querySelectorAll('[data-xp-step]')];
    if (!steps.length) return;
    const index = Math.max(0, Math.min(steps.length - 1, requested));
    wizard.dataset.xpStep = String(index);
    steps.forEach((entry, ordinal) => conceal(entry, ordinal !== index));
    wizard.querySelectorAll('.xp-step-index li').forEach((entry, ordinal) => { if (ordinal === index) entry.setAttribute('aria-current', 'step'); else entry.removeAttribute('aria-current'); });
    const back = wizard.querySelector('[data-xp-action="step-back"]'), next = wizard.querySelector('[data-xp-action="step-next"]');
    if (back) back.disabled = index === 0;
    if (next) next.textContent = index === steps.length - 1 ? wizard.closest('[data-xp-inquiry]') ? 'Prepare email' : 'Finish' : 'Next';
  }
  function page(root, index) {
    const entries = records(root);
    const total = Math.max(1, Math.ceil(entries.length / 2));
    index = Math.max(0, Math.min(total - 1, index)); root.dataset.xpPage = String(index);
    entries.forEach((entry, ordinal) => conceal(entry, Math.floor(ordinal / 2) !== index));
    const previous = root.querySelector('[data-xp-action="page-back"]'), next = root.querySelector('[data-xp-action="page-next"]');
    if (previous) previous.disabled = index === 0; if (next) next.disabled = index >= total - 1;
    announce(root, `Page ${index + 1} of ${total}.`);
  }
  function dialogFor(root, source, trigger, type = '') {
    activeDialog?.close();
    const dialog = document.createElement('dialog');
    dialog.className = `xp xp-dialog ${type}`; dialog.dataset.xpModal = 'true';
    dialog.setAttribute('aria-label', root.dataset.xpLabel || root.querySelector('h1,h2,h3')?.textContent || 'Details');
    const close = document.createElement('button'); close.type = 'button'; close.className = 'xp-control xp-close'; close.textContent = 'Close';
    const content = source.cloneNode(true); content.removeAttribute('hidden'); content.removeAttribute('data-xp-concealed');
    // Cloned panels never reuse document IDs or edit identities from their source.
    [content, ...content.querySelectorAll('*')].forEach((node) => {
      for (const attribute of ['id', 'data-section', 'data-item-id', 'data-item-index', 'data-owner-item-id', 'data-part-key', 'data-part-slot']) node.removeAttribute(attribute);
      if (node.matches('[data-xp-record]')) node.dataset.xpConcealed = 'false';
    });
    dialog.append(close, content); site.append(dialog); activeDialog = dialog;
    if (trigger.dataset.xpAction === 'command' && !content.querySelector('[data-xp-search]')) {
      const label = document.createElement('label'); label.className = 'xp-search'; label.textContent = 'Search commands';
      const input = document.createElement('input'); input.type = 'search'; input.maxLength = 180; input.dataset.xpSearch = 'true'; label.append(input); content.prepend(label);
    }
    on(close, 'click', () => dialog.close());
    on(dialog, 'keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dialog.close(); } });
    on(dialog, 'close', () => { if (activeDialog === dialog) activeDialog = null; dialog.remove(); if (trigger.isConnected && !inspecting()) trigger.focus({ preventScroll: true }); }, { once: true });
    if (type === 'xp-full-menu') content.querySelectorAll('a').forEach((link) => on(link, 'click', () => dialog.close()));
    dialog.showModal(); dialog.dataset.xpEnhanced = 'true'; close.focus();
    const input = content.querySelector('[data-xp-search]'); if (input) input.focus();
    return dialog;
  }
  function lightbox(root, index, trigger) {
    const entries = records(root).filter((entry) => entry.querySelector('img,svg'));
    if (!entries.length) { announce(root, 'Add an image to use the viewer.'); return; }
    index = Math.max(0, Math.min(entries.length - 1, index));
    const dialog = dialogFor(root, entries[index], trigger);
    const controls = document.createElement('div'); controls.className = 'xp-controls';
    const previous = document.createElement('button'), next = document.createElement('button');
    for (const [button, label] of [[previous, 'Previous image'], [next, 'Next image']]) { button.type = 'button'; button.className = 'xp-control'; button.textContent = label; controls.append(button); }
    const panel = dialog.children[1];
    const show = (desired) => {
      index = (desired + entries.length) % entries.length;
      const replacement = entries[index].cloneNode(true);
      [replacement, ...replacement.querySelectorAll('*')].forEach((node) => { node.removeAttribute('id'); for (const key of [...node.attributes].map((attribute) => attribute.name)) if (key.startsWith('data-')) node.removeAttribute(key); });
      replacement.querySelectorAll('button').forEach((button) => button.remove());
      panel.replaceChildren(...replacement.childNodes);
      dialog.setAttribute('aria-label', `${index + 1} of ${entries.length}: ${entries[index].textContent.trim().slice(0, 180)}`);
    };
    dialog.append(controls); on(previous, 'click', () => show(index - 1)); on(next, 'click', () => show(index + 1));
    on(dialog, 'keydown', (event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); } if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); } });
    show(index);
  }
  function sync() {
    const inspect = inspecting();
    if (inspect) activeDialog?.close();
    for (const root of roots) {
      root.dataset.xpEnhanced = String(!inspect);
      if (!inspect) {
        activateTab(root, Number(root.dataset.xpTab || 0));
        if (root.querySelector('[data-xp-wizard]')) step(root, Number(root.querySelector('[data-xp-wizard]').dataset.xpStep || 0));
        if (root.dataset.xpWidget === 'pagination') page(root, Number(root.dataset.xpPage || 0));
        if (root.querySelector('[data-xp-period]')) root.dataset.xpPeriod ||= 'monthly';
      }
      root.querySelectorAll('details').forEach((detail) => {
        if (inspect) { if (!disclosures.has(detail)) disclosures.set(detail, detail.open); detail.open = true; }
        else if (disclosures.has(detail)) { detail.open = disclosures.get(detail); disclosures.delete(detail); }
      });
      root.querySelectorAll('[data-xp-compare]').forEach((compare) => { compare.dataset.xpCompareEnhanced = String(!inspect); });
    }
    if (inspect || reduced.matches || !site.classList.contains('motion-expressive')) {
      roots.forEach((root) => root.style.removeProperty('--xp-scroll-shift'));
    }
  }
  on(site, 'click', async (event) => {
    const button = event.target.closest('[data-xp-action]');
    if (!button || inspecting() || button.disabled) return;
    const root = rootOf(button); if (!root) return;
    const action = button.dataset.xpAction;
    if (action === 'tab') activateTab(root, Number(button.dataset.xpIndex));
    else if (action === 'filter') { root.dataset.xpFilter = button.dataset.xpFilter || ''; root.querySelectorAll('[data-xp-action="filter"]').forEach((entry) => entry.setAttribute('aria-pressed', String(entry === button))); filter(root); }
    else if (action === 'sort') { const list = root.querySelector('[data-xp-sortable]'); if (list) { const descending = root.dataset.xpSort !== 'desc' && root.dataset.xpSort === 'asc'; root.dataset.xpSort = descending ? 'desc' : 'asc'; [...list.children].sort((a, b) => (descending ? -1 : 1) * a.textContent.localeCompare(b.textContent)).forEach((entry) => list.append(entry)); button.textContent = descending ? 'Sort A–Z' : 'Sort Z–A'; announce(root, descending ? 'Sorted descending.' : 'Sorted ascending.'); } }
    else if (['open-widget', 'open-menu', 'command', 'details'].includes(action)) { const source = action === 'details' ? button.closest('[data-xp-record]') : root.querySelector(action === 'open-menu' ? '[data-xp-menu]' : action === 'command' ? '.xp-collection' : '[data-xp-dialog-content]'); if (source) dialogFor(root, source, button, action === 'open-menu' ? 'xp-full-menu' : root.dataset.xpWidget === 'drawer' ? 'xp-drawer' : ''); }
    else if (action === 'lightbox') lightbox(root, Number(button.dataset.xpIndex), button);
    else if (['previous', 'next'].includes(action)) { const rail = root.querySelector('[data-xp-rail]'); if (rail) { rail.scrollBy({ left: (action === 'next' ? 1 : -1) * rail.clientWidth * .8, behavior: reduced.matches || site.classList.contains('motion-none') ? 'auto' : 'smooth' }); announce(root, action === 'next' ? 'Next entries.' : 'Previous entries.'); } }
    else if (action === 'period') { root.dataset.xpPeriod = button.dataset.xpPeriod; root.querySelectorAll('[data-xp-action="period"]').forEach((entry) => entry.setAttribute('aria-pressed', String(entry === button))); }
    else if (['segment', 'select-option'].includes(action)) { root.querySelectorAll(`[data-xp-action="${action}"]`).forEach((entry) => entry.setAttribute('aria-pressed', String(entry === button))); announce(root, `${button.closest('li')?.querySelector('span')?.textContent || button.textContent} selected.`); }
    else if (action === 'confirm') { if (button.dataset.xpConfirm === 'ready') { button.dataset.xpConfirm = 'done'; button.textContent = 'Confirmed'; button.setAttribute('aria-pressed', 'true'); announce(root, 'Confirmed in this view.'); } else { button.dataset.xpConfirm = 'ready'; button.textContent = 'Confirm now'; announce(root, 'Activate Confirm now to confirm.'); } }
    else if (action === 'copy') { const text = root.querySelector('textarea'); if (!text) return; try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text.value); announce(root, 'Copied.'); } catch { text.focus(); text.select(); announce(root, 'Text selected. Use your browser copy command.'); } }
    else if (action === 'feedback') announce(root, root.querySelector('p')?.textContent || 'Action completed in this view.');
    else if (action === 'dismiss') { const record = button.closest('[data-xp-record]'); if (record) { conceal(record, true); announce(root, 'Dismissed in this view.'); } }
    else if (action === 'read') { const record = button.closest('[data-xp-record]'); if (record) { const read = record.dataset.xpRead !== 'true'; record.dataset.xpRead = String(read); button.setAttribute('aria-pressed', String(read)); button.textContent = read ? 'Mark as unread' : 'Mark as read'; announce(root, read ? 'Marked as read.' : 'Marked as unread.'); } }
    else if (action === 'step-back') { const wizard = button.closest('[data-xp-wizard]'); step(wizard, Number(wizard.dataset.xpStep || 0) - 1); }
    else if (action === 'step-next') {
      const wizard = button.closest('[data-xp-wizard]'), steps = [...wizard.querySelectorAll('[data-xp-step]')], index = Number(wizard.dataset.xpStep || 0);
      const input = steps[index]?.querySelector('input,textarea');
      if (input && !input.reportValidity()) return;
      if (index < steps.length - 1) { step(wizard, index + 1); steps[index + 1].querySelector('input,textarea')?.focus(); }
      else {
        const inquiry = wizard.closest('[data-xp-inquiry]');
        if (inquiry) { const email = inquiry.dataset.xpEmail; if (!email) { announce(root, 'Add a public contact email in Brand settings before preparing an inquiry.'); return; } const values = steps.map((entry) => entry.querySelector('input,textarea')?.value || ''); location.href = `mailto:${email}?subject=${encodeURIComponent('Website inquiry')}&body=${encodeURIComponent(values.join('\n\n'))}`; announce(root, 'Email draft prepared in your mail app.'); }
        else { announce(root, 'All steps completed in this view.'); button.textContent = 'Completed'; button.disabled = true; }
      }
    }
    else if (['page-back', 'page-next'].includes(action)) page(root, Number(root.dataset.xpPage || 0) + (action === 'page-next' ? 1 : -1));
    else if (action === 'add-tag') { const input = root.querySelector('[data-xp-tag-input]'), list = root.querySelector('.xp-tags'); const value = input?.value.trim(); if (!value) { announce(root, 'Enter a tag first.'); return; } if (list.children.length >= 8) { announce(root, 'This view supports up to eight tags.'); return; } const li = document.createElement('li'), span = document.createElement('span'), remove = document.createElement('button'); span.textContent = value; remove.type = 'button'; remove.className = 'xp-control'; remove.dataset.xpAction = 'remove-tag'; remove.textContent = 'Remove tag'; li.append(span, remove); list.append(li); input.value = ''; announce(root, 'Tag added.'); input.focus(); }
    else if (action === 'remove-tag') { button.closest('li')?.remove(); announce(root, 'Tag removed.'); root.querySelector('[data-xp-tag-input]')?.focus(); }
    else if (action === 'add-local') { const list = root.querySelector('.xp-local-items'); if (list && list.children.length < 8) { const li = document.createElement('li'); li.textContent = root.querySelector('p')?.textContent || 'New local entry'; list.append(li); announce(root, `${list.children.length} local entries.`); } }
    else if (action === 'project-progress') { const tasks = [...root.querySelectorAll('[data-xp-task]')]; announce(root, `${tasks.filter((entry) => entry.checked).length} of ${tasks.length} tasks completed.`); }
    else if (action === 'order') { const input = root.querySelector('[data-xp-quantity]'); if (!input?.reportValidity()) return; const selected = root.querySelector('[data-xp-panel]:not([data-xp-concealed="true"]) h3')?.textContent || 'Selected product'; announce(root, `${Number(input.value)} × ${selected}. Local summary; no payment was submitted.`); }
    else if (action === 'pause') { const paused = root.dataset.xpPaused !== 'true'; root.dataset.xpPaused = String(paused); button.setAttribute('aria-pressed', String(paused)); button.textContent = paused ? 'Resume movement' : 'Pause movement'; }
  });
  on(site, 'input', (event) => {
    if (inspecting()) return;
    const root = rootOf(event.target); if (!root) return;
    if (event.target.matches('[data-xp-search]')) filter(root);
    if (event.target.matches('[data-xp-range]')) event.target.parentElement.querySelector('output').textContent = event.target.value;
    if (event.target.matches('[data-xp-compare-range]')) { const compare = event.target.closest('[data-xp-compare]'); compare.style.setProperty('--xp-compare-position', `${Math.max(0, Math.min(100, Number(event.target.value)))}%`); compare.querySelector('output').textContent = `${event.target.value}%`; }
  });
  on(site, 'submit', (event) => { if (!event.target.matches('[data-xp-account]')) return; event.preventDefault(); if (!inspecting() && event.target.reportValidity()) announce(rootOf(event.target), 'Updated in this view. Connect an account service to persist these details.'); });
  on(site, 'keydown', (event) => {
    if (inspecting()) return;
    if (event.target.matches('[data-xp-tag-input]') && event.key === 'Enter') { event.preventDefault(); rootOf(event.target).querySelector('[data-xp-action="add-tag"]').click(); }
    if (!event.target.matches('[data-xp-action="tab"]')) return;
    const root = rootOf(event.target), count = root.querySelectorAll('[data-xp-action="tab"]').length;
    let index = Number(root.dataset.xpTab || 0);
    if (event.key === 'ArrowRight') index = (index + 1) % count;
    else if (event.key === 'ArrowLeft') index = (index + count - 1) % count;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = count - 1;
    else return;
    event.preventDefault(); activateTab(root, index, true);
  });
  on(document, 'keydown', (event) => {
    if (inspecting() || event.repeat || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k' || event.target.matches('input,textarea,[contenteditable="true"]')) return;
    const button = site.querySelector('[data-xp-action="command"],.xp-widget-command [data-xp-action="open-widget"]');
    if (button) { event.preventDefault(); button.click(); }
  });
  function scroll() {
    scrollFrame = 0;
    for (const root of roots) {
      if (root.dataset.xpBlock === 'shrink') root.closest('.site-section').dataset.xpScrolled = String(window.scrollY > 80 && !inspecting());
      if (root.dataset.xpBlock === 'layers' && !inspecting() && !reduced.matches && site.classList.contains('motion-expressive')) { const offset = Math.max(-45, Math.min(45, -root.getBoundingClientRect().top * .07)); root.style.setProperty('--xp-scroll-shift', `${offset.toFixed(1)}px`); }
      if (root.dataset.xpBlock === 'progress-nav') { const links = [...root.querySelectorAll('a[href^="#"]')]; let current; for (const link of links) { const id = link.getAttribute('href').slice(1), section = document.getElementById(id); if (section && section.getBoundingClientRect().top <= 160) current = link; } links.forEach((link) => { if (link === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); }
    }
  }
  on(window, 'scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(scroll); }, { passive: true });
  const mode = new MutationObserver(sync); mode.observe(document.body, { attributes: true, attributeFilter: ['data-edit-mode'] });
  on(reduced, 'change', sync);
  const marquees = roots.filter((root) => root.querySelector('[data-xp-marquee]'));
  function syncMarquee() {
    clearInterval(marqueeTimer);
    if (!marquees.length || document.hidden || inspecting() || reduced.matches || !site.classList.contains('motion-expressive')) return;
    marqueeTimer = setInterval(() => {
      for (const root of marquees) { const rail = root.querySelector('[data-xp-marquee]'); if (root.dataset.xpPaused === 'true' || root.matches(':hover,:focus-within')) continue; const end = rail.scrollWidth - rail.clientWidth; if (end > 0) rail.scrollLeft = rail.scrollLeft >= end - 1 ? 0 : rail.scrollLeft + 1; }
    }, 50);
  }
  on(document, 'visibilitychange', syncMarquee); on(reduced, 'change', syncMarquee);
  const marqueeMode = new MutationObserver(syncMarquee); marqueeMode.observe(document.body, { attributes: true, attributeFilter: ['data-edit-mode'] });
  on(window, 'pagehide', (event) => { if (event.persisted) return; lifetime.abort(); mode.disconnect(); marqueeMode.disconnect(); clearInterval(marqueeTimer); cancelAnimationFrame(scrollFrame); activeDialog?.close(); });
  syncMarquee();
  sync(); scroll();
})();

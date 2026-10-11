/** Fixed bundled notices. Browser loads only these same-origin, allowlisted paths. */
export const BUNDLED_NOTICES = Object.freeze(['HYPERUI', 'FANCY', 'WATERMELON', 'USELAYOUTS', 'CULT', 'VELORA', 'FEATHER']);
export function bundledNotices(notices = {}, hyperui = '') {
  return Object.fromEntries(BUNDLED_NOTICES.map((name) => [name, name === 'HYPERUI' ? notices[name] || hyperui : notices[name] || '']).filter(([, text]) => text));
}
export function noticeComment(notices = {}, originalLicense = '') {
  const entries = [originalLicense && `Forma\n${originalLicense}`, ...Object.entries(bundledNotices(notices)).map(([name, text]) => `${name}\n${text}`)].filter(Boolean);
  // Comments must remain inert even if a future upstream notice contains HTML delimiters.
  return entries.length ? `<!-- Bundled source licenses\n${entries.join('\n\n').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('--', '- -')}\n-->\n` : '';
}

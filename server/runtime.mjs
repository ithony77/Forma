// Security baseline reviewed 2026-09-27. Raise these floors as security updates
// ship; this offline check cannot know about advisories published afterward.
export const RUNTIME_REQUIREMENT = 'Node.js 22.23.3+ (22.x) or 24.21.0+ (24.x)';
export function supportedRuntime(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return false;
  const [, major, minor, patch] = match.map(Number);
  if (major === 22) return minor > 23 || minor === 23 && patch >= 3;
  if (major === 24) return minor >= 21;
  return false;
}

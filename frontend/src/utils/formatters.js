/**
 * Formats an ISO date string to a human-readable format
 */
export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Converts language bytes to percentage distribution
 */
export function languagePercentages(languages) {
  if (!languages || typeof languages !== 'object') return [];
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (!total) return [];
  return Object.entries(languages)
    .map(([name, bytes]) => ({ name, value: Math.round((bytes / total) * 100) }))
    .sort((a, b) => b.value - a.value);
}

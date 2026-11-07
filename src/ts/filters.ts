// Search filters that stack, like a search site's: classifications to show (any of them, or all in the same
// clip), classifications to leave out, and a date or date range. Kept in the page address (?has=raccoon,cat&
// match=all&not=person&from=2026-11-01&to=2026-11-06), so a search can be bookmarked or sent to someone.

export type Filters = {
  labels: string[];        // show events with these classifications
  match: 'any' | 'all';    // any one of the labels, or all of them in the same event
  without: string[];       // and none of these
  from: string;            // first date, yyyy-mm-dd; '' for no limit
  to: string;              // last date, yyyy-mm-dd; '' for no limit
};

export const NO_FILTERS: Filters = { labels: [], match: 'any', without: [], from: '', to: '' };

const DATE = /^\d{4}-\d\d-\d\d$/;
const list = (v: string | null) => (v ?? '').split(',').map((s) => s.trim().toLowerCase()).filter((s) => s);

export function hasFilters(f: Filters): boolean {
  return f.labels.length > 0 || f.without.length > 0 || !!f.from || !!f.to;
}

export function filtersFromUrl(search: string = window.location.search): Filters {
  const p = new URLSearchParams(search);
  const from = p.get('from') ?? '', to = p.get('to') ?? '';
  return {
    labels: list(p.get('has')),
    match: p.get('match') === 'all' ? 'all' : 'any',
    without: list(p.get('not')),
    from: DATE.test(from) ? from : '',
    to: DATE.test(to) ? to : '',
  };
}

// Puts the filters in the address without reloading; other parameters and the #/event link are kept
export function filtersToUrl(f: Filters): void {
  const p = new URLSearchParams(window.location.search);
  for (const k of ['has', 'match', 'not', 'from', 'to']) p.delete(k);
  if (f.labels.length) p.set('has', f.labels.join(','));
  if (f.labels.length > 1 && f.match === 'all') p.set('match', 'all');
  if (f.without.length) p.set('not', f.without.join(','));
  if (f.from) p.set('from', f.from);
  if (f.to) p.set('to', f.to);
  const q = p.toString().replace(/%2C/g, ',');
  history.replaceState(history.state, '', window.location.pathname + (q ? '?' + q : '') + window.location.hash);
}

// The query string for the server's /catcam/search
export function filtersToQuery(f: Filters): string {
  const p: string[] = [];
  if (f.labels.length) p.push('labels=' + encodeURIComponent(f.labels.join(',')));
  if (f.labels.length > 1 && f.match === 'all') p.push('match=all');
  if (f.without.length) p.push('without=' + encodeURIComponent(f.without.join(',')));
  if (f.from) p.push('from=' + f.from.replace(/-/g, ''));
  if (f.to) p.push('to=' + f.to.replace(/-/g, ''));
  return p.join('&');
}

// "Nov 6", "Nov 1 – Nov 6", "From Nov 1", "Until Nov 6"
export function dateChipText(f: Filters): string {
  const show = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric',
    year: d.substring(0, 4) === String(new Date().getFullYear()) ? undefined : 'numeric' });
  if (f.from && f.to) return f.from === f.to ? show(f.from) : `${show(f.from)} – ${show(f.to)}`;
  if (f.from) return `From ${show(f.from)}`;
  if (f.to) return `Until ${show(f.to)}`;
  return '';
}

// Search filters, as people pick them: which animals (or people) to show, whether a clip needs any or all of
// them, hiding people, and when. Kept in the page address (?has=raccoon,cat&match=all&not=person&when=7d, or
// from=2026-11-01&to=2026-11-06 for chosen dates), so a search can be bookmarked or sent to someone.

export type When = '' | 'today' | 'yesterday' | '7d' | '30d';

export type Filters = {
  labels: string[];        // show clips with these classifications
  match: 'any' | 'all';    // any one of the labels, or all of them in the same clip
  without: string[];       // and none of these (in the app: "Hide people")
  when: When;              // a quick date choice, or '' for none / chosen dates
  from: string;            // chosen first date, yyyy-mm-dd; '' for no limit
  to: string;              // chosen last date, yyyy-mm-dd; '' for no limit
};

export const NO_FILTERS: Filters = { labels: [], match: 'any', without: [], when: '', from: '', to: '' };

export const WHEN_CHOICES: { value: When; text: string }[] = [
  { value: 'today', text: 'Today' },
  { value: 'yesterday', text: 'Yesterday' },
  { value: '7d', text: 'Past week' },
  { value: '30d', text: 'Past month' },
];

// the ones on the main row of buttons; the rest wait under "More filters"
export const MAIN_WHEN: When[] = ['today', 'yesterday', '7d'];

const DATE = /^\d{4}-\d\d-\d\d$/;
const list = (v: string | null) => (v ?? '').split(',').map((s) => s.trim().toLowerCase()).filter((s) => s);

export function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

export function hasDate(f: Filters): boolean {
  return !!f.when || !!f.from || !!f.to;
}

export function hasFilters(f: Filters): boolean {
  return f.labels.length > 0 || f.without.length > 0 || hasDate(f);
}

// The dates to search, yyyy-mm-dd ('' for no limit), with a quick choice worked out from today
export function dateRange(f: Filters): { from: string; to: string } {
  switch (f.when) {
    case 'today': return { from: daysAgo(0), to: daysAgo(0) };
    case 'yesterday': return { from: daysAgo(1), to: daysAgo(1) };
    case '7d': return { from: daysAgo(6), to: '' };
    case '30d': return { from: daysAgo(29), to: '' };
    default: return { from: f.from, to: f.to };
  }
}

export function filtersFromUrl(search: string = window.location.search): Filters {
  const p = new URLSearchParams(search);
  const from = p.get('from') ?? '', to = p.get('to') ?? '';
  const when = p.get('when') ?? '';
  return {
    labels: list(p.get('has')),
    match: p.get('match') === 'all' ? 'all' : 'any',
    without: list(p.get('not')),
    when: WHEN_CHOICES.some((c) => c.value === when) ? when as When : '',
    from: DATE.test(from) ? from : '',
    to: DATE.test(to) ? to : '',
  };
}

// Puts the filters in the address without reloading; other parameters and the #/event link are kept
export function filtersToUrl(f: Filters): void {
  const p = new URLSearchParams(window.location.search);
  for (const k of ['has', 'match', 'not', 'when', 'from', 'to']) p.delete(k);
  if (f.labels.length) p.set('has', f.labels.join(','));
  if (f.labels.length > 1 && f.match === 'all') p.set('match', 'all');
  if (f.without.length) p.set('not', f.without.join(','));
  if (f.when) p.set('when', f.when);
  else {
    if (f.from) p.set('from', f.from);
    if (f.to) p.set('to', f.to);
  }
  const q = p.toString().replace(/%2C/g, ',');
  history.replaceState(history.state, '', window.location.pathname + (q ? '?' + q : '') + window.location.hash);
}

// The query string for the server's /catcam/search
export function filtersToQuery(f: Filters): string {
  const p: string[] = [];
  const { from, to } = dateRange(f);
  if (f.labels.length) p.push('labels=' + encodeURIComponent(f.labels.join(',')));
  if (f.labels.length > 1 && f.match === 'all') p.push('match=all');
  if (f.without.length) p.push('without=' + encodeURIComponent(f.without.join(',')));
  if (from) p.push('from=' + from.replace(/-/g, ''));
  if (to) p.push('to=' + to.replace(/-/g, ''));
  return p.join('&');
}

// "Nov 6", "Nov 1 – Nov 6", "Since Nov 1", "Until Nov 6" (the year only when it isn't this year)
export function showDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric',
    year: d.substring(0, 4) === String(new Date().getFullYear()) ? undefined : 'numeric' });
}

// What the Date button says
export function dateButtonText(f: Filters): string {
  const quick = WHEN_CHOICES.find((c) => c.value === f.when);
  if (quick) return quick.text;
  if (f.from && f.to) return f.from === f.to ? showDate(f.from) : `${showDate(f.from)} – ${showDate(f.to)}`;
  if (f.from) return `Since ${showDate(f.from)}`;
  if (f.to) return `Until ${showDate(f.to)}`;
  return 'Any date';
}

// The plural people read, e.g. "raccoons"
export const PLURAL: Record<string, string> = {
  cat: 'cats', dog: 'dogs', raccoon: 'raccoons', person: 'people', delivery: 'deliveries', animal: 'animals',
};
const plural = (l: string) => PLURAL[l] ?? l;

function joinWords(words: string[], last: string): string {
  return words.length < 2 ? (words[0] ?? '') : words.slice(0, -1).join(', ') + ` ${last} ` + words[words.length - 1];
}

// One sentence saying what the list shows, e.g. "Cats or raccoons from the past week, with no people"
export function describe(f: Filters): string {
  let what = f.labels.length === 0 ? 'All clips'
    : f.labels.length > 1 && f.match === 'all' ? `Clips with ${joinWords(f.labels.map((l) => 'a ' + (l === 'person' ? 'person' : l)), 'and')} together`
    : joinWords(f.labels.map(plural), 'or');
  what = what.charAt(0).toUpperCase() + what.slice(1);
  const quick = WHEN_CHOICES.find((c) => c.value === f.when);
  let when = '';
  if (quick) when = f.when === 'today' || f.when === 'yesterday' ? ` from ${quick.text.toLowerCase()}` : ` from the ${quick.text.toLowerCase()}`;
  else if (f.from && f.to) when = f.from === f.to ? ` on ${showDate(f.from)}` : ` from ${showDate(f.from)} to ${showDate(f.to)}`;
  else if (f.from) when = ` since ${showDate(f.from)}`;
  else if (f.to) when = ` until ${showDate(f.to)}`;
  const without = f.without.length ? `, with no ${joinWords(f.without.map(plural), 'or')}` : '';
  return what + when + without;
}

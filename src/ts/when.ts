// Friendly times for the clip list, from an event's name (yyyyMMdd_HHmmss_NNNN, the camera's local time):
// day headings like Google Photos ("Today", "Yesterday", "Wed, Nov 4", with the year when it isn't this
// year), "7:23 PM", and "16 min ago".
import { localDate } from './filters';

export function eventDay(meName: string): string {
  return `${meName.substring(0, 4)}-${meName.substring(4, 6)}-${meName.substring(6, 8)}`;
}

export function dayHeading(day: string): string {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (day === localDate(today)) return 'Today';
  if (day === localDate(yesterday)) return 'Yesterday';
  const d = new Date(day + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

export function clockTime(meName: string): string {
  const h = Number(meName.substring(9, 11)), m = meName.substring(11, 13);
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

// "just now", "16 min ago", "3 hours ago", "yesterday"-ish "1 day ago", "23 days ago"
export function agoText(ms: number): string {
  const min = ms / 60000, hours = min / 60, days = hours / 24;
  if (isNaN(ms)) return '';
  if (min < 1) return 'just now';
  if (min < 60) return `${Math.round(min)} min ago`;
  if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'} ago`;
  return `${Math.round(days)} day${Math.round(days) === 1 ? '' : 's'} ago`;
}

// The gap to the clip before, e.g. "12 days" or "20 min"
export function gapText(ms: number): string {
  return agoText(ms).replace(' ago', '').replace('just now', 'under a minute');
}

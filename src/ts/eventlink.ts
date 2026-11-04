// Links to one event, as the cameras' Telegram alerts send them:
// <server>/cmo_client/index.html#/event/<camera>/<yyyyMMdd>/<event>
export interface EventLink { meGroup: string; meEventGroup: string; meName: string; }

const EVENT_HASH = /^#\/event\/([^/]+)\/(\d{8})\/([^/]+)$/;

// the event named in a page's #/event/... part, or null
export function eventLinkFromHash(hash: string): EventLink | null {
  const m = EVENT_HASH.exec(hash);
  if (!m) return null;
  const [meGroup, meEventGroup, meName] = m.slice(1).map(decodeURIComponent) as [string, string, string];
  return { meGroup, meEventGroup, meName };
}

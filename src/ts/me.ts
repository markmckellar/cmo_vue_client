import { ref } from 'vue';
import { CMO_SERVER } from './catcamservices';

// Who is using the web app, from the server's /auth/config, shared by the header and the event player.
// person: someone signed in with Google (a server in google mode); null on a server at home (open mode),
// where everyone on the home network may do everything.
// animalsOnly: every clip they see is free of people; shownLabels: the only labels they can find (null: any),
// from their grants (see the server's Access)
export type Me = { email: string; name?: string; admin: boolean; viewOnly: boolean; animalsOnly: boolean; shownLabels: string[] | null };

// what an animals-only person (friends) can find; the server shows them only clips with one of these and no person
export const ANIMAL_LABELS = ['cat', 'dog', 'raccoon', 'animal'];
export const me = ref<Me | null>(null);

// Until /auth/config answers, and on an older server without it, nothing is hidden; the server still decides.
export const mayRelabel = () => !me.value || !me.value.viewOnly;
export const mayDelete = () => !me.value || me.value.admin;

export async function loadMe(): Promise<void> {
  try {
    const cfg = await (await fetch(CMO_SERVER + 'auth/config', { credentials: 'same-origin' })).json();
    if (cfg.caller === 'person')
      me.value = { email: cfg.email, name: cfg.name, admin: !!cfg.admin, viewOnly: !!cfg.view_only, animalsOnly: !!cfg.animals_only,
        shownLabels: Array.isArray(cfg.labels) ? cfg.labels : (cfg.animals_only && !('labels' in cfg) ? ANIMAL_LABELS : null) };
  } catch {
    // an older server without /auth/config: no sign-in
  }
}

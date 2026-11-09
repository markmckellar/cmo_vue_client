<template>
  <!-- The admin's access page (#/access): who is waiting, every person and the group they're in, each group's
       rules (which cameras or homes, which kinds of clip, whether they may relabel), homes, and who was turned
       away. Groups are the unit of access; "Own rules" gives one person a group of their own. The server keeps
       it all in access.json (see cmo_server's AuthController and Access). -->
  <section class="acc">
    <div class="acc_top">
      <div>
        <h2 class="acc_title">Access</h2>
        <p class="acc_muted">Who can see which cameras, and which clips. Changes apply at once, even to people already signed in.</p>
      </div>
      <a class="btn" href="#/">← Back to the cameras</a>
    </div>

    <p v-if="note" class="acc_note" :class="{ acc_note_bad: noteBad }" role="status">{{ note }}</p>
    <p v-if="loading" class="acc_muted">Loading…</p>
    <p v-else-if="loadError" class="acc_note acc_note_bad">{{ loadError }}</p>

    <template v-else>
      <!-- Waiting for approval -->
      <div class="acc_section">
        <h3>Waiting for approval <span class="acc_count">{{ data.pending.length }}</span></h3>
        <p v-if="!data.pending.length" class="acc_muted">Nobody is waiting.</p>
        <div v-for="p in data.pending" :key="p.email" class="acc_card acc_row">
          <div class="acc_who">
            <b>{{ p.name || p.email }}</b>
            <span class="acc_muted">{{ p.email }} · asked {{ when(p.firstSeen) }}</span>
          </div>
          <div class="acc_actions">
            <label class="acc_inline">Into group
              <select v-model="pick[p.email]" class="select">
                <option value="__own">A new group just for them (sees nothing yet)</option>
                <option v-for="g in data.accounts" :key="g.id" :value="g.id">{{ g.id }} — {{ g.summary }}</option>
              </select>
            </label>
            <button type="button" class="btn btn_primary" @click="approve(p.email)">Approve</button>
            <button type="button" class="btn btn_danger" @click="turnAway(p.email, false)">Reject</button>
          </div>
        </div>
      </div>

      <!-- People -->
      <div class="acc_section">
        <h3>People <span class="acc_count">{{ people.length }}</span></h3>
        <p class="acc_muted">Each person is in one group and sees what that group's rules allow. To give someone different
          access from the rest of their group, use <b>Own rules</b>.</p>
        <div class="acc_toolbar">
          <input v-model="search" type="search" class="acc_input" placeholder="Filter by email" aria-label="Filter people by email" />
        </div>
        <div class="acc_table" role="table" aria-label="People">
          <div v-for="person in shownPeople" :key="person.email" class="acc_card acc_person" role="row">
            <div class="acc_who" role="cell">
              <b>{{ person.email }}</b>
              <span v-if="person.admin" class="acc_badge acc_badge_admin">Admin · sees everything</span>
              <span v-else class="acc_muted">{{ groupOf(person.group)?.summary ?? 'nothing' }}</span>
            </div>
            <div class="acc_actions" role="cell">
              <label class="acc_inline">Group
                <select v-model="pick[person.email]" class="select" :aria-label="'Group for ' + person.email">
                  <option v-for="g in data.accounts" :key="g.id" :value="g.id">{{ g.id }}</option>
                </select>
              </label>
              <button type="button" class="btn" :disabled="pick[person.email] === person.group"
                @click="move(person.email, person.group)">Move</button>
              <button v-if="!person.admin" type="button" class="btn" title="Make a group just for this person, starting from their current rules"
                @click="ownRules(person.email, person.group)">Own rules…</button>
              <button type="button" class="btn" @click="editGroup(person.group)">Edit {{ person.group }}</button>
              <button v-if="!person.admin" type="button" class="btn btn_danger" @click="turnAway(person.email, true)">Remove access</button>
            </div>
          </div>
          <p v-if="!shownPeople.length" class="acc_muted">Nobody matches.</p>
        </div>
        <form class="acc_card acc_add" @submit.prevent="addPerson">
          <b>Add someone before they sign in</b>
          <input v-model="newEmail" type="email" class="acc_input" placeholder="name@gmail.com" required aria-label="Email to add" />
          <select v-model="newEmailGroup" class="select" aria-label="Group for the new person">
            <option value="__own">A new group just for them (sees nothing yet)</option>
            <option v-for="g in data.accounts" :key="g.id" :value="g.id">{{ g.id }}</option>
          </select>
          <button type="submit" class="btn btn_primary">Add person</button>
        </form>
      </div>

      <!-- Groups -->
      <div class="acc_section">
        <div class="acc_section_head">
          <h3>Groups <span class="acc_count">{{ data.accounts.length }}</span></h3>
          <button type="button" class="btn btn_primary" @click="newGroup()">+ New group</button>
        </div>

        <div v-for="g in data.accounts" :key="g.id" class="acc_card acc_group" :class="{ acc_group_open: editing?.id === g.id && !editing.isNew }">
          <div class="acc_row">
            <div class="acc_who">
              <b>{{ g.id }}</b>
              <span class="acc_muted">{{ g.summary }}</span>
              <span class="acc_chips">
                <span v-if="g.view_only" class="acc_badge">View only</span>
                <span v-else class="acc_badge acc_badge_ok">Can relabel</span>
                <span v-for="m in g.members" :key="m" class="acc_badge acc_badge_person">{{ m }}</span>
                <span v-if="!g.members.length" class="acc_muted">no people</span>
                <span v-for="d in devicesOf(g.id)" :key="d.id" class="acc_badge" :title="d.role === 'reader' ? 'A script that sees what this group sees' : 'A camera that uploads here (not limited by these rules)'">
                  device: {{ d.id }}</span>
              </span>
            </div>
            <div class="acc_actions" v-if="editing?.id !== g.id">
              <button type="button" class="btn" @click="editGroup(g.id)">Edit rules</button>
            </div>
          </div>
          <GroupEditor v-if="editing && editing.id === g.id && !editing.isNew" />
        </div>

        <div v-if="editing?.isNew" class="acc_card acc_group acc_group_open">
          <GroupEditor />
        </div>
      </div>

      <!-- Homes -->
      <div class="acc_section">
        <div class="acc_section_head">
          <h3>Homes <span class="acc_count">{{ homesDraft.length || 1 }}</span></h3>
          <button v-if="!homesOpen" type="button" class="btn" @click="openHomes">Edit homes</button>
        </div>
        <p class="acc_muted">A rule can cover a whole home: every camera in it, including ones added later. Cameras not
          in a home are in "Home".</p>
        <div v-if="!homesOpen" class="acc_card">
          <div v-for="h in homesShown" :key="h.id" class="acc_home_line"><b>{{ h.name }}</b>
            <span class="acc_muted">{{ h.cameras.length ? h.cameras.map(cameraName).join(', ') : 'no cameras' }}</span></div>
        </div>
        <div v-else class="acc_card">
          <div v-for="(h, i) in homesDraft" :key="i" class="acc_home_edit">
            <input v-model="h.name" class="acc_input" placeholder="Name, e.g. Grandma's" aria-label="Home name" />
            <input v-model="h.id" class="acc_input acc_input_short" placeholder="id, e.g. grandma" aria-label="Home id" />
            <span class="acc_chips">
              <button v-for="c in allCameras" :key="c" type="button" class="chip" :class="{ chip_on: h.cameras.includes(c) }"
                :aria-pressed="h.cameras.includes(c)" @click="toggleHomeCamera(h, c)">{{ cameraName(c) }}</button>
            </span>
            <button type="button" class="btn btn_danger btn_small" @click="homesDraft.splice(i, 1)">Remove home</button>
          </div>
          <div class="acc_actions">
            <button type="button" class="btn" @click="homesDraft.push({ id: '', name: '', cameras: [] })">+ Add a home</button>
            <span class="acc_spacer"></span>
            <button type="button" class="btn" @click="homesOpen = false">Cancel</button>
            <button type="button" class="btn btn_primary" @click="saveHomes">Save homes</button>
          </div>
        </div>
      </div>

      <!-- Turned away -->
      <div v-if="data.rejected.length" class="acc_section">
        <h3>Turned away <span class="acc_count">{{ data.rejected.length }}</span></h3>
        <p class="acc_muted">They see nothing, and signing in again doesn't ask you again.</p>
        <div v-for="e in data.rejected" :key="e" class="acc_card acc_row">
          <div class="acc_who"><b>{{ e }}</b></div>
          <div class="acc_actions">
            <select v-model="pick[e]" class="select" :aria-label="'Group for ' + e">
              <option value="__own">A new group just for them (sees nothing yet)</option>
              <option v-for="g in data.accounts" :key="g.id" :value="g.id">{{ g.id }}</option>
            </select>
            <button type="button" class="btn" @click="approve(e)">Let in after all</button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue';
import { apiFetch, cameraName, CMO_SERVER } from '../ts/catcamservices';
import { CLASSIFICATIONS } from '../ts/meollama';
import LabelIcon from './LabelIcon.vue';

type Level = 'world' | 'home' | 'camera';
type Grant = { level: Level; id: string | null; show: string[] | null; hide: string[] };
type Group = { id: string; members: string[]; view_only: boolean; grants: Grant[]; summary: string };
type Pending = { email: string; name: string; firstSeen: string };
type Home = { id: string; name: string; cameras: string[] };
type Device = { id: string; account: string; role: string };
type Requests = { pending: Pending[]; homes: Home[]; accounts: Group[]; rejected: string[]; admins: string[]; devices: Device[] };

// one rule in the editor: where ("world", "home:<id>" or "camera:<id>"), and which clips
type RuleDraft = { where: string; mode: 'all' | 'only'; show: string[]; hide: string[] };
type GroupDraft = { id: string; isNew: boolean; viewOnly: boolean; rules: RuleDraft[] };
type PreviewRow = { camera: string; total: number; visible: number };

const data = ref<Requests>({ pending: [], homes: [], accounts: [], rejected: [], admins: [], devices: [] });
const cameras = ref<string[]>([]);
const loading = ref(true);
const loadError = ref('');
const note = ref('');
const noteBad = ref(false);
const pick = reactive<Record<string, string>>({});    // the group picked for each person (email -> group id)
const search = ref('');
const newEmail = ref('');
const newEmailGroup = ref('__own');
const editing = ref<GroupDraft | null>(null);

// the kinds of clip a rule can name. "legs" (part of a person) always goes with "person", so it isn't offered
const LABELS = CLASSIFICATIONS.map((c) => c.label);
const PEOPLE = ['person', 'legs'];

function say(text: string, bad = false) {
  note.value = text;
  noteBad.value = bad;
  if (!bad) setTimeout(() => { if (note.value === text) note.value = ''; }, 6000);
}

async function post(path: string, body: unknown): Promise<any> {
  const res = await apiFetch(CMO_SERVER + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error || String(res.status));
  return json;
}

async function load() {
  try {
    const res = await apiFetch(CMO_SERVER + 'auth/admin/requests');
    if (!res.ok) {
      loadError.value = res.status === 403 ? 'Only admins can see this page.' : "Couldn't load the access list (" + res.status + ').';
      return;
    }
    data.value = await res.json();
    data.value.admins ??= [];
    data.value.devices ??= [];
    for (const g of data.value.accounts) for (const m of g.members) pick[m] = g.id;
    // a quick Approve starts on a new group of their own, which sees nothing until given rules
    for (const p of data.value.pending) pick[p.email] ??= '__own';
    for (const e of data.value.rejected) pick[e] ??= '__own';
    loadError.value = '';
  } catch {
    loadError.value = "Couldn't reach the server.";
  } finally {
    loading.value = false;
  }
}

async function loadCameras() {
  try {
    const res = await apiFetch(CMO_SERVER + 'catcam/megroups');
    if (res.ok) cameras.value = (await res.json()).map((g: { meGroup: string }) => g.meGroup);
  } catch {
    // only the cameras named in the rules and homes are offered
  }
}

onMounted(() => {
  load();
  loadCameras();
});

// every camera the server has, plus any named in a rule, a home or a device's group that has no clips yet
const allCameras = computed(() => {
  const s = new Set(cameras.value);
  for (const g of data.value.accounts) for (const r of g.grants) if (r.level === 'camera' && r.id) s.add(r.id);
  for (const h of data.value.homes) for (const c of h.cameras) s.add(c);
  return [...s].sort();
});

const homesShown = computed<Home[]>(() => {
  const listed = data.value.homes;
  const inHome = new Set(listed.flatMap((h) => h.cameras));
  const rest = allCameras.value.filter((c) => !inHome.has(c));
  return [...listed, ...(rest.length || !listed.length ? [{ id: 'home', name: 'Home', cameras: rest }] : [])];
});

function groupOf(id: string | undefined): Group | undefined {
  return data.value.accounts.find((g) => g.id === id);
}

function devicesOf(id: string): Device[] {
  return data.value.devices.filter((d) => d.account === id);
}

const people = computed(() => {
  const out: { email: string; group: string; admin: boolean }[] = [];
  const admins = new Set(data.value.admins.map((a) => a.toLowerCase()));
  for (const g of data.value.accounts) for (const m of g.members) out.push({ email: m, group: g.id, admin: admins.has(m.toLowerCase()) });
  return out.sort((a, b) => Number(b.admin) - Number(a.admin) || a.email.localeCompare(b.email));
});

const shownPeople = computed(() => {
  const q = search.value.trim().toLowerCase();
  return q ? people.value.filter((p) => p.email.toLowerCase().includes(q)) : people.value;
});

function when(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

// a group name made from an email, not already taken: aidan.mckellar7@gmail.com -> aidan_mckellar7
function groupNameFor(email: string): string {
  const base = (email.split('@')[0] ?? 'person').toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'person';
  let name = base;
  for (let i = 2; groupOf(name); i++) name = base + '_' + i;
  return name;
}

// for "A new group just for them": make it (seeing nothing, view only) and return its name
async function ensureGroup(choice: string, email: string): Promise<string> {
  if (choice !== '__own') return choice;
  const id = groupNameFor(email);
  await post('auth/admin/account', { id, view_only: true, grants: [] });
  return id;
}

async function approve(email: string) {
  try {
    const choice = pick[email] ?? '__own';
    const account = await ensureGroup(choice, email);
    await post('auth/admin/approve', { email, account });
    await load();
    if (choice === '__own') {
      editGroup(account);
      say(email + ' is in their own group, ' + account + ', which sees nothing yet. Add a rule below and save.');
    } else say(email + ' approved into ' + account + '.');
  } catch (e) {
    say("Couldn't approve " + email + ': ' + (e as Error).message, true);
  }
}

async function addPerson() {
  const email = newEmail.value.trim().toLowerCase();
  if (!email) return;
  if (people.value.some((p) => p.email.toLowerCase() === email)) {
    say(email + ' already has access; move them below.', true);
    return;
  }
  pick[email] = newEmailGroup.value;
  await approve(email);
  newEmail.value = '';
}

async function move(email: string, from: string) {
  const to = pick[email];
  if (!to || to === from) return;
  const g = groupOf(to);
  if (!confirm('Move ' + email + ' from ' + from + ' to ' + to + '?\n\nThey will see: ' + (g?.summary ?? '') + (g?.view_only ? ' (view only)' : ''))) {
    pick[email] = from;
    return;
  }
  try {
    await post('auth/admin/approve', { email, account: to });
    say(email + ' moved to ' + to + '.');
    await load();
  } catch (e) {
    say("Couldn't move " + email + ': ' + (e as Error).message, true);
  }
}

// give one person a group of their own, starting from what they see now, and open it to edit
async function ownRules(email: string, from: string) {
  const g = groupOf(from);
  const id = groupNameFor(email);
  if (!confirm('Make a group "' + id + '" just for ' + email + ', starting with the same rules as ' + from + '?\n\nYou can then change their rules without affecting anyone else.')) return;
  try {
    await post('auth/admin/account', { id, view_only: g?.view_only ?? true, grants: g?.grants ?? [] });
    await post('auth/admin/approve', { email, account: id });
    await load();
    editGroup(id);
    say(email + ' now has their own group, ' + id + '. Change the rules below and save.');
  } catch (e) {
    say("Couldn't make the group: " + (e as Error).message, true);
  }
}

async function turnAway(email: string, member: boolean) {
  const text = member
    ? 'Remove ' + email + "'s access? They won't see the cameras any more. You can let them in again under \"Turned away\"."
    : 'Reject ' + email + "? They won't be asked about again.";
  if (!confirm(text)) return;
  try {
    await post('auth/admin/reject', { email });
    say(member ? email + ' no longer has access.' : email + ' turned away.');
    await load();
  } catch (e) {
    say("Couldn't do that: " + (e as Error).message, true);
  }
}

// --- the group editor ---

function toDraft(g: Grant): RuleDraft {
  const fold = (l: string[]) => [...new Set(l.map((x) => (x === 'legs' ? 'person' : x)))];
  return {
    where: g.level === 'world' ? 'world' : g.level + ':' + g.id,
    mode: g.show ? 'only' : 'all',
    show: g.show ? fold(g.show) : [],
    hide: fold(g.hide),
  };
}

function fromDraft(r: RuleDraft): Grant {
  const [level, id] = r.where === 'world' ? ['world', null] : [r.where.slice(0, r.where.indexOf(':')), r.where.slice(r.where.indexOf(':') + 1)];
  const unfold = (l: string[]) => l.flatMap((x) => (x === 'person' ? PEOPLE : [x]));
  return { level: level as Level, id, show: r.mode === 'only' ? unfold(r.show) : null, hide: unfold(r.hide) };
}

function editGroup(id: string) {
  const g = groupOf(id);
  if (!g) return;
  editing.value = { id: g.id, isNew: false, viewOnly: g.view_only, rules: g.grants.map(toDraft) };
  preview.value = null;
  requestAnimationFrame(() => document.getElementById('group-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

function newGroup() {
  editing.value = { id: '', isNew: true, viewOnly: true, rules: [{ where: 'world', mode: 'only', show: ['cat'], hide: ['person'] }] };
  preview.value = null;
  requestAnimationFrame(() => document.getElementById('group-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

// quick starts for one rule
const PRESETS: { name: string; mode: 'all' | 'only'; show: string[]; hide: string[] }[] = [
  { name: 'Everything', mode: 'all', show: [], hide: [] },
  { name: 'Animals, no people', mode: 'only', show: ['cat', 'dog', 'raccoon'], hide: ['person', 'delivery'] },
  { name: 'Cats only', mode: 'only', show: ['cat'], hide: ['person'] },
  { name: 'No people', mode: 'all', show: [], hide: ['person', 'delivery'] },
];

// "what they'd see": clip counts per camera for the rules being edited, asked again a moment after each change
const preview = ref<{ ready: boolean; cameras: PreviewRow[] } | null>(null);
const previewError = ref('');
let previewTimer: ReturnType<typeof setTimeout> | undefined;
watch(editing, (d) => {
  clearTimeout(previewTimer);
  if (!d) return;
  previewTimer = setTimeout(async () => {
    try {
      const bad = d.rules.find((r) => r.mode === 'only' && !r.show.length);
      if (bad) {
        previewError.value = 'Pick at least one kind of clip for each "Only clips with" rule.';
        return;
      }
      preview.value = await post('auth/admin/preview', { grants: d.rules.map(fromDraft) });
      previewError.value = '';
    } catch (e) {
      previewError.value = "Couldn't preview: " + (e as Error).message;
    }
  }, 350);
}, { deep: true });

async function saveGroup() {
  const d = editing.value;
  if (!d) return;
  const id = d.id.trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    say('A group name may have only letters, digits, _ and - (no spaces).', true);
    return;
  }
  if (d.isNew && groupOf(id)) {
    say('There is already a group called ' + id + '.', true);
    return;
  }
  if (d.rules.some((r) => r.mode === 'only' && !r.show.length)) {
    say('Pick at least one kind of clip for each "Only clips with" rule, or choose "All clips".', true);
    return;
  }
  try {
    await post('auth/admin/account', { id, view_only: d.viewOnly, grants: d.rules.map(fromDraft) });
    editing.value = null;
    await load();
    say('Saved ' + id + ': ' + (groupOf(id)?.summary ?? '') + '.');
  } catch (e) {
    say("Couldn't save " + id + ': ' + (e as Error).message, true);
  }
}

async function deleteGroup() {
  const d = editing.value;
  if (!d || d.isNew) return;
  if (!confirm('Delete the group ' + d.id + '?')) return;
  try {
    await post('auth/admin/account/delete', { id: d.id });
    editing.value = null;
    await load();
    say('Deleted ' + d.id + '.');
  } catch (e) {
    say("Couldn't delete " + d.id + ': ' + (e as Error).message, true);
  }
}

function toggle(list: string[], label: string) {
  const i = list.indexOf(label);
  if (i >= 0) list.splice(i, 1);
  else list.push(label);
}

const whereOptions = computed(() => [
  { value: 'world', text: 'Every camera, including ones added later' },
  ...homesShown.value.map((h) => ({ value: 'home:' + h.id, text: 'Home: ' + h.name + ' (every camera in it)' })),
  ...allCameras.value.map((c) => ({ value: 'camera:' + c, text: 'Camera: ' + cameraName(c) })),
]);

const plural = (l: string) => ({ cat: 'Cats', dog: 'Dogs', raccoon: 'Raccoons', person: 'People', animal: 'Any animal', delivery: 'Deliveries' } as Record<string, string>)[l] ?? l;

// the editor, as a render function so it can sit inside its group's card (or alone, for a new group)
const GroupEditor = defineComponent({
  setup() {
    return () => {
      const d = editing.value!;
      const chips = (list: string[], kind: 'show' | 'hide') => h('span', { class: 'acc_chips' },
        LABELS.map((l) => h('button', {
          type: 'button',
          class: ['chip', list.includes(l) ? (kind === 'hide' ? 'chip_off' : 'chip_on') : ''],
          'aria-pressed': list.includes(l),
          onClick: () => toggle(list, l),
        }, [h(LabelIcon, { label: l, size: 16 }), ' ', plural(l)])));
      const rows = preview.value?.cameras ?? [];
      return h('div', { class: 'acc_editor', id: 'group-editor' }, [
        h('div', { class: 'acc_editor_head' }, [
          d.isNew
            ? h('label', { class: 'acc_field' }, ['Group name ',
                h('input', { class: 'acc_input', value: d.id, placeholder: 'e.g. aidan', onInput: (e: Event) => { d.id = (e.target as HTMLInputElement).value; } })])
            : h('b', { class: 'acc_editor_title' }, 'Rules for ' + d.id),
          h('label', { class: 'acc_switch' }, [
            h('input', { type: 'checkbox', checked: !d.viewOnly, onChange: (e: Event) => { d.viewOnly = !(e.target as HTMLInputElement).checked; } }),
            ' Can change labels (otherwise view only)',
          ]),
        ]),
        h('p', { class: 'acc_muted' }, 'They see a clip if any rule lets it through. A rule says where (every camera, a home, or one camera) and which clips.'),
        ...d.rules.map((r, i) => h('div', { class: 'acc_rule' }, [
          h('div', { class: 'acc_rule_line' }, [
            h('span', { class: 'acc_rule_n' }, 'Rule ' + (i + 1)),
            h('select', {
              class: 'select', value: r.where, 'aria-label': 'Where',
              onChange: (e: Event) => { r.where = (e.target as HTMLSelectElement).value; },
            }, whereOptions.value.map((o) => h('option', { value: o.value, selected: o.value === r.where }, o.text))),
            h('span', { class: 'acc_spacer' }),
            h('button', { type: 'button', class: 'btn btn_danger btn_small', onClick: () => d.rules.splice(i, 1) }, 'Remove rule'),
          ]),
          h('div', { class: 'acc_rule_line' }, [
            h('span', { class: 'acc_rule_label' }, 'Quick:'),
            ...PRESETS.map((p) => h('button', {
              type: 'button', class: 'btn btn_small',
              onClick: () => { r.mode = p.mode; r.show = [...p.show]; r.hide = [...p.hide]; },
            }, p.name)),
          ]),
          h('div', { class: 'acc_rule_line' }, [
            h('span', { class: 'acc_rule_label' }, 'Show:'),
            h('label', { class: 'acc_radio' }, [h('input', { type: 'radio', checked: r.mode === 'all', onChange: () => { r.mode = 'all'; } }), ' All clips']),
            h('label', { class: 'acc_radio' }, [h('input', { type: 'radio', checked: r.mode === 'only', onChange: () => { r.mode = 'only'; } }), ' Only clips with any of:']),
            r.mode === 'only' ? chips(r.show, 'show') : null,
          ]),
          h('div', { class: 'acc_rule_line' }, [
            h('span', { class: 'acc_rule_label' }, 'Never show clips with:'),
            chips(r.hide, 'hide'),
          ]),
          r.hide.includes('person')
            ? h('p', { class: 'acc_muted acc_small' }, 'Hiding people also hides clips the AI hasn\'t classified yet, so nothing slips through.')
            : null,
        ])),
        h('div', { class: 'acc_actions' }, [
          h('button', { type: 'button', class: 'btn', onClick: () => d.rules.push({ where: 'world', mode: 'all', show: [], hide: [] }) }, '+ Add a rule'),
          d.rules.length ? null : h('span', { class: 'acc_warn' }, 'No rules: this group sees nothing.'),
        ]),
        h('div', { class: 'acc_preview' }, [
          h('b', 'What they would see'),
          previewError.value ? h('p', { class: 'acc_warn' }, previewError.value)
            : !preview.value ? h('p', { class: 'acc_muted' }, 'Counting…')
            : h('div', { class: 'acc_preview_rows' }, [
                ...rows.map((row) => h('div', { class: 'acc_preview_row' }, [
                  h('span', { class: 'acc_preview_cam' }, cameraName(row.camera)),
                  h('span', { class: 'acc_bar' }, [h('span', { class: 'acc_bar_fill', style: { width: (row.total ? (100 * row.visible) / row.total : 0) + '%' } })]),
                  h('span', { class: 'acc_preview_n' }, row.visible.toLocaleString() + ' of ' + row.total.toLocaleString() + ' clips'),
                ])),
                preview.value.ready ? null : h('p', { class: 'acc_muted acc_small' }, 'The server is still indexing clips; counts may be low.'),
              ]),
        ]),
        h('div', { class: 'acc_actions acc_editor_foot' }, [
          !d.isNew ? h('button', {
            type: 'button', class: 'btn btn_danger', onClick: deleteGroup,
            disabled: (groupOf(d.id)?.members.length ?? 0) > 0 || devicesOf(d.id).length > 0,
            title: (groupOf(d.id)?.members.length ?? 0) > 0 ? 'Move its people to another group first' : devicesOf(d.id).length ? 'A device belongs to it' : undefined,
          }, 'Delete group') : null,
          h('span', { class: 'acc_spacer' }),
          h('button', { type: 'button', class: 'btn', onClick: () => { editing.value = null; } }, 'Cancel'),
          h('button', { type: 'button', class: 'btn btn_primary', onClick: saveGroup }, d.isNew ? 'Create group' : 'Save changes'),
        ]),
      ]);
    };
  },
});

// --- homes ---
const homesOpen = ref(false);
const homesDraft = ref<Home[]>([]);
function openHomes() {
  homesDraft.value = data.value.homes.map((h) => ({ id: h.id, name: h.name, cameras: [...h.cameras] }));
  if (!homesDraft.value.length) homesDraft.value.push({ id: 'home', name: 'Home', cameras: [...allCameras.value] });
  homesOpen.value = true;
}
function toggleHomeCamera(home: Home, camera: string) {
  for (const other of homesDraft.value) if (other !== home) other.cameras = other.cameras.filter((c) => c !== camera);
  toggle(home.cameras, camera);
}
async function saveHomes() {
  try {
    await post('auth/admin/homes', { homes: homesDraft.value.map((h) => ({ id: h.id.trim(), name: h.name.trim(), cameras: h.cameras })) });
    homesOpen.value = false;
    await load();
    say('Homes saved.');
  } catch (e) {
    say("Couldn't save the homes: " + (e as Error).message, true);
  }
}
</script>

<style>
/* not scoped: the group editor is a render function in this file and uses these too */
.acc { max-width: 980px; margin: 0 auto; }
.acc_top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
.acc_title { font-size: 1.5rem; }
.acc_muted { color: var(--text-muted); margin: 4px 0; }
.acc_small { font-size: 0.82rem; }
.acc_section { margin-top: 32px; }
.acc_section h3 { font-size: 1.1rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.acc_section_head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.acc_count { display: inline-block; min-width: 1.6em; padding: 0 7px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border);
  color: var(--text-muted); font-size: 0.8rem; text-align: center; font-weight: 600; }
.acc_card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin: 10px 0; }
.acc_row, .acc_person { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.acc_who { display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.acc_actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; min-width: 0; max-width: 100%; }
.acc_inline { display: inline-flex; gap: 8px; align-items: center; color: var(--text-muted); font-size: 0.9rem; min-width: 0; max-width: 100%; }
.acc_inline .select { min-width: 0; flex: 1 1 auto; }
.acc_inline .select { max-width: 340px; }
.acc_spacer { flex: 1; }
.acc_toolbar { margin: 8px 0; }
.acc_input { font: inherit; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface-2); color: var(--text); min-width: 0; }
.acc_toolbar .acc_input { width: 100%; max-width: 360px; }
.acc_input_short { width: 10em; }
.acc_add { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.acc_add .acc_input { flex: 1 1 220px; }
.acc .select { max-width: 100%; text-overflow: ellipsis; }
.acc_note { padding: 10px 14px; border-radius: var(--radius-sm); background: rgba(47, 180, 124, 0.15); border: 1px solid #2fb47c; }
.acc_note_bad { background: rgba(224, 97, 58, 0.15); border-color: #e0613a; }
.acc_warn { color: #f08a65; margin: 4px 0; }
.acc_chips { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 4px; }
.acc_badge { display: inline-block; padding: 1px 9px; border-radius: 999px; font-size: 0.78rem; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-muted); }
.acc_badge_ok { color: #2fb47c; border-color: #2fb47c; }
.acc_badge_admin { color: var(--accent); border-color: var(--accent); align-self: flex-start; }
.acc_badge_person { color: var(--text); }
.acc_group_open { border-color: var(--accent); }
.acc_home_line { display: flex; gap: 10px; flex-wrap: wrap; padding: 2px 0; }
.acc_home_edit { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }

.btn.btn_danger { border-color: #e0613a; color: #f08a65; background: transparent; }
.btn.btn_danger:hover:not(:disabled) { background: rgba(224, 97, 58, 0.15); border-color: #f08a65; }
.btn_small { padding: 5px 12px; font-size: 0.85rem; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn:disabled:hover { border-color: var(--border); background: var(--surface-2); }
.btn.btn_danger:disabled:hover { background: transparent; border-color: #e0613a; }

.chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 11px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--surface-2); color: var(--text-muted); font-size: 0.85rem; }
.chip:hover { border-color: var(--text-muted); }
.chip_on { background: var(--accent); border-color: var(--accent); color: var(--accent-contrast); font-weight: 600; }
.chip_off { background: rgba(224, 97, 58, 0.2); border-color: #e0613a; color: #f6b39b; font-weight: 600; text-decoration: line-through; }

.acc_editor { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
.acc_editor_head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.acc_editor_title { font-size: 1.05rem; }
.acc_field { display: inline-flex; gap: 8px; align-items: center; }
.acc_switch { display: inline-flex; gap: 8px; align-items: center; cursor: pointer; }
.acc_switch input, .acc_radio input { accent-color: var(--accent); width: 18px; height: 18px; }
.acc_rule { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.acc_rule_line { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.acc_rule_line .select { max-width: 100%; }
.acc_rule_n { font-weight: 700; }
.acc_rule_label { color: var(--text-muted); font-size: 0.9rem; min-width: 4.5em; }
.acc_radio { display: inline-flex; gap: 6px; align-items: center; cursor: pointer; }
.acc_preview { background: var(--bg); border: 1px dashed var(--border); border-radius: var(--radius-sm); padding: 12px; }
.acc_preview_rows { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.acc_preview_row { display: grid; grid-template-columns: 8em 1fr auto; gap: 10px; align-items: center; font-size: 0.9rem; }
.acc_bar { height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.acc_bar_fill { display: block; height: 100%; background: var(--accent); }
.acc_preview_n { color: var(--text-muted); white-space: nowrap; }
.acc_editor_foot { border-top: 1px solid var(--border); padding-top: 12px; }

@media (max-width: 600px) {
  .acc_preview_row { grid-template-columns: 1fr auto; }
  .acc_bar { grid-column: 1 / -1; order: 3; }
  .acc_inline { flex-wrap: wrap; }
}
</style>

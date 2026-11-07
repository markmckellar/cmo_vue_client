<template>
  <section class="cmo_event_group">
    <!-- a heading only for a single camera; with several, the cameras are filter buttons -->
    <div v-if="cameras.length <= 1" class="group_header">
      <!-- MeGroupList puts the camera's name here -->
      <slot name="title"><h2 class="group_title">{{meGroupText === ALL_CAMERAS ? 'All cameras' : meGroupText.replace(/_/g, " ")}}</h2></slot>
    </div>

    <!-- Filters the way shopping and photo apps do them: the main choices are plain words on big buttons, all
         in sight; tap one to turn it on (filled, with a check), tap again to turn it off. "All" clears them.
         Dates and hiding people are rarely needed, so they wait under "More filters". -->
    <div class="filters">
      <!-- every filter in one group of the same buttons: what (Cats, Dogs, ...: several at once), when (Today,
           Yesterday, Past week: one at a time) and More (rarer dates, hiding people). Tap to turn on (orange, with a
           check), tap again to turn off. Cameras start all on, and the kinds of clip start with "All clips" on;
           "Clear filters" in the Showing line resets everything.
           A rarer filter, once on, shows here as its own button with an x, so everything that's on is in sight. -->
      <div class="chip_row" role="group" aria-label="Filters">
        <!-- cameras first, all on to start (like Ring or Nest): tap one off to leave it out; a camera icon marks them -->
        <template v-if="cameras.length > 1">
          <button v-for="cam in cameras" :key="'cam:' + cam" type="button" class="chip chip_camera" :class="{ chip_on: cameraOn(cam) }"
            :aria-pressed="cameraOn(cam)" @click="toggleCamera(cam)">
            <svg class="chip_icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>
            {{cameraName(cam)}}
          </button>
        </template>
        <!-- the kinds of clip start with "All clips" on (nothing picked = every clip, including ones the AI found
             nothing in); tapping a kind turns it off, tapping "All clips" brings everything back -->
        <button type="button" class="chip" :class="{ chip_on: filters.labels.length === 0 }" :aria-pressed="filters.labels.length === 0"
          @click="update({ labels: [] })">All clips</button>
        <button v-for="c in choices" :key="c.label" type="button" class="chip" :class="{ chip_on: filters.labels.includes(c.label) }"
          :aria-pressed="filters.labels.includes(c.label)" @click="toggle(c.label)">
          <template v-if="filters.labels.includes(c.label)"><svg class="chip_tick" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg></template>
          {{c.text}}
        </button>
        <button v-for="c in mainWhen" :key="c.value" type="button" class="chip" :class="{ chip_on: filters.when === c.value }"
          :aria-pressed="filters.when === c.value" @click="setWhen(filters.when === c.value ? '' : c.value)">
          <template v-if="filters.when === c.value"><svg class="chip_tick" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg></template>
          {{c.text}}
        </button>
        <button v-if="otherDate" type="button" class="chip chip_on" :aria-label="`${dateButtonText(filters)}: tap to remove`" @click="setWhen('')">
          {{dateButtonText(filters)}} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <button v-if="filters.match === 'all' && filters.labels.length > 1" type="button" class="chip chip_on"
          aria-label="All in one clip: tap to remove" @click="setMatch('any')">
          All in one clip <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <button v-if="hidingPeople" type="button" class="chip chip_on" aria-label="No people: tap to remove" @click="toggleHidePeople()">
          No people <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <button type="button" class="chip chip_more" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
          More
          <svg :class="{ flipped: moreOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>

      <div v-if="moreOpen" class="more">
        <div class="chip_row" role="group" aria-label="More dates">
          <button v-for="c in moreWhen" :key="c.value" type="button" class="chip chip_small" :class="{ chip_on: filters.when === c.value }"
            @click="setWhen(filters.when === c.value ? '' : c.value)">{{c.text}}</button>
          <button type="button" class="chip chip_small" :class="{ chip_on: !!(filters.from || filters.to) }" :aria-expanded="picking"
            @click="picking = !picking">{{filters.from || filters.to ? dateButtonText(filters) : 'Pick dates…'}}</button>
        </div>
        <div v-if="picking" class="date_pick">
          <label>From <input type="date" class="date_input" v-model="dateFrom" :max="today"></label>
          <label>To <input type="date" class="date_input" v-model="dateTo" :min="dateFrom" :max="today"></label>
          <button type="button" class="btn btn_primary" :disabled="!dateFrom && !dateTo" @click="applyDates()">Show</button>
          <div class="date_hint">Leave "To" empty for just one day.</div>
        </div>
        <label v-if="choices.length > 1" class="switch" :class="{ switch_off: filters.labels.length < 2 }">
          <input type="checkbox" :checked="filters.match === 'all' && filters.labels.length > 1" :disabled="filters.labels.length < 2"
            @change="setMatch(filters.match === 'all' ? 'any' : 'all')">
          <span class="switch_track" aria-hidden="true"><span class="switch_knob"></span></span>
          <span>All in one clip <span class="switch_hint">{{filters.labels.length < 2 ? '(pick two or more first, e.g. Cats and Dogs)' : '(e.g. a cat and a dog together)'}}</span></span>
        </label>
        <label v-if="mayHidePeople" class="switch">
          <input type="checkbox" :checked="hidingPeople" @change="toggleHidePeople()">
          <span class="switch_track" aria-hidden="true"><span class="switch_knob"></span></span>
          Hide clips with people
        </label>
      </div>

      <p class="summary" aria-live="polite">
        <span><span class="summary_label">Showing:</span> {{describe(filters)}}</span>
        <button v-if="hasFilters(filters)" type="button" class="link" @click="clearAll()">Clear filters</button>
      </p>
    </div>

    <MeEventList :meGroupText="meGroupText" :filters="filters" :key="listKey" @clear-date="setWhen('')" @clear-all="clearAll()" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { me } from '../ts/me';
import { MAIN_WHEN, WHEN_CHOICES, dateButtonText, describe, filtersFromUrl, filtersToUrl, hasDate, hasFilters, localDate, type Filters, type When } from '../ts/filters';
import MeEventList from './MeEventList.vue';
import { ALL_CAMERAS, cameraName } from '../ts/catcamservices';
import type { MeGroup } from '../ts/megroup';

const props = withDefaults(defineProps<{
  meGroupText: string;
  cameras?: string[];    // every camera the viewer has; filters.cameras is the ones picked ([] = all)
  cameraInfo?: Record<string, MeGroup>;    // per camera, what the viewer may find there (labels, hidden)
}>(), {
  cameras: () => [],
  cameraInfo: () => ({}),
});

const filters = ref<Filters>(filtersFromUrl());
// a new list (and a new search) whenever the filters change
const listKey = computed(() => JSON.stringify(filters.value));

// The buttons, in the words people use. Deliveries only for a porch camera; someone limited to some kinds of
// clips (friends: animals only) gets only those. "Person" also finds the AI's "legs" (the server matches both).
const choices = computed(() => {
  const all = [
    { label: 'cat', text: 'Cats', color: 'var(--accent)' },
    { label: 'dog', text: 'Dogs', color: '#4f8df5' },
    { label: 'raccoon', text: 'Raccoons', color: '#a26bf0' },
    { label: 'person', text: 'People', color: '#2fb47c' },
    { label: 'delivery', text: 'Deliveries', color: '#e0613a' },
  ];
  // a button shows when some camera being looked at allows it (and stays while it's on, so it can be turned off)
  return all.filter((c) => filters.value.labels.includes(c.label)
    || (showing.value.some((cam) => mayFind(cam, c.label)) && (c.label !== 'delivery' || showing.value.some((cam) => cam.includes('porch')))));
});
// the cameras being looked at: the ones picked, else all of them
const showing = computed(() => filters.value.cameras.length ? filters.value.cameras : props.cameras.length ? props.cameras : [props.meGroupText]);
// may the viewer find clips with this label on this camera? From the server's per-camera grants; an older server
// (no labels in megroups) falls back to what /auth/config says
function mayFind(cam: string, label: string): boolean {
  const c = props.cameraInfo[cam];
  const labels = c && 'labels' in c ? c.labels : me.value?.shownLabels ?? null;
  const hidden = c?.hidden ?? (me.value?.animalsOnly ? ['person', 'legs', 'delivery'] : []);
  return (!labels || labels.includes(label)) && !hidden.includes(label);
}
// "Hide people" only where people can be seen at all
const mayHidePeople = computed(() => !filters.value.labels.includes('person') && showing.value.some((cam) => mayFind(cam, 'person')));
const hidingPeople = computed(() => filters.value.without.includes('person'));

const mainWhen = WHEN_CHOICES.filter((c) => MAIN_WHEN.includes(c.value));
const moreWhen = WHEN_CHOICES.filter((c) => !MAIN_WHEN.includes(c.value));
// a date chosen under More filters (Past month, picked dates)
const otherDate = computed(() => hasDate(filters.value) && !MAIN_WHEN.includes(filters.value.when));

// "More" (rarer dates, hiding people): closed unless asked for
const moreOpen = ref(false);
const picking = ref(!!(filters.value.from || filters.value.to));
const dateFrom = ref(filters.value.from);
const dateTo = ref(filters.value.to === filters.value.from ? '' : filters.value.to);
const today = localDate(new Date());

function update(change: Partial<Filters>): void {
  filters.value = { ...filters.value, ...change };
  // like shopping and photo sites: choices of one kind add up (Cats + Dogs: clips of either), kinds narrow each
  // other (camera x animal x time). "All in one clip" (under More) turns animals into clips with all of them.
  if (filters.value.labels.length < 2) filters.value.match = 'any';
  filtersToUrl(filters.value);
}

// cameras: none picked means all of them, so all show as on to start
function cameraOn(cam: string): boolean {
  return filters.value.cameras.length === 0 || filters.value.cameras.includes(cam);
}
function toggleCamera(cam: string): void {
  const on = filters.value.cameras.length ? filters.value.cameras : props.cameras;
  let next = on.includes(cam) ? on.filter((c) => c !== cam) : [...on, cam];
  // all of them, or (turning off the last one) none: back to "all cameras"
  if (next.length === 0 || props.cameras.every((c) => next.includes(c))) next = [];
  update({ cameras: next.filter((c) => props.cameras.includes(c)) });
}

function toggle(label: string): void {
  const on = filters.value.labels.includes(label);
  const labels = on ? filters.value.labels.filter((l) => l !== label) : [...filters.value.labels, label];
  // picking People undoes "Hide people"
  const without = label === 'person' && !on ? filters.value.without.filter((l) => l !== 'person') : filters.value.without;
  update({ labels, without });
}
function setMatch(match: 'any' | 'all'): void {
  update({ match });
}
function toggleHidePeople(): void {
  update({ without: hidingPeople.value ? filters.value.without.filter((l) => l !== 'person') : [...filters.value.without, 'person'] });
}
function setWhen(when: When): void {
  dateFrom.value = '';
  dateTo.value = '';
  update({ when, from: '', to: '' });
  picking.value = false;
}
function applyDates(): void {
  // one date is that day; two are a range (in either order)
  let from = dateFrom.value || dateTo.value, to = dateTo.value || dateFrom.value;
  if (from > to) [from, to] = [to, from];
  update({ when: '', from, to });
}
function clearAll(): void {
  dateFrom.value = '';
  dateTo.value = '';
  update({ cameras: [], labels: [], match: 'any', without: [], when: '', from: '', to: '' });
}

</script>

<style scoped>
.group_header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  margin-bottom: 14px;
}

.group_title {
  font-size: 1.5rem;
  text-transform: capitalize;
}

.filters {
  display: grid;
  gap: 12px;
  margin-bottom: 22px;
}












/* the buttons wrap rather than scroll, so every choice is in sight */
.chip_row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}






.chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.chip:hover {
  border-color: var(--text-muted);
}

.chip:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.chip_on,
.chip_on:hover {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-contrast);
}

.chip_icon {
  margin-left: -2px;
}

.chip_tick {
  margin-left: -4px;
}











.date_input {
  min-height: 40px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  color-scheme: dark;
}

.date_hint {
  color: var(--text-muted);
  font-size: 0.85rem;
}







.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 14px;
  margin: 0;
  color: var(--text-muted);
  font-size: 1rem;
}

.summary span {
  color: var(--text);
}

.summary .summary_label {
  color: var(--text-muted);
}


.chip_more {
  border-style: dashed;
  color: var(--text-muted);
}

.chip_more[aria-expanded="true"] {
  border-style: solid;
  border-color: var(--text-muted);
  color: var(--text);
}

.chip_more svg {
  transition: transform 0.15s;
}

.chip_more svg.flipped {
  transform: rotate(180deg);
}

.chip_small {
  min-height: 40px;
  padding: 0 14px;
  font-size: 0.9rem;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  font-size: 1rem;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}




.more {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}


.date_pick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}

.date_pick label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
}

.date_pick .btn:disabled {
  opacity: 0.5;
}

.date_hint {
  flex-basis: 100%;
}

/* an on/off switch, like a phone's settings */
.switch {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 1rem;
  cursor: pointer;
}

.switch_off {
  opacity: 0.55;
  cursor: default;
}

.switch_hint {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch_track {
  flex: none;
  position: relative;
  width: 46px;
  height: 28px;
  border-radius: 999px;
  background: var(--border);
  transition: background 0.15s;
}

.switch_knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s;
}

.switch input:checked + .switch_track {
  background: var(--accent);
}

.switch input:checked + .switch_track .switch_knob {
  transform: translateX(18px);
}

.switch input:focus-visible + .switch_track {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>

<template>
  <section class="cmo_event_group">
    <div class="group_header">
      <!-- MeGroupList puts its camera picker here -->
      <slot name="title"><h2 class="group_title">{{meGroupText.replace(/_/g, " ")}}</h2></slot>
    </div>

    <!-- Filters the way shopping and photo apps do them: the main choices are plain words on big buttons, all
         in sight; tap one to turn it on (filled, with a check), tap again to turn it off. "All" clears them.
         Dates and hiding people are rarely needed, so they wait under "More filters". -->
    <div class="filters">
      <div class="chip_row" role="group" aria-label="What to show">
        <button type="button" class="chip" :class="{ chip_on: filters.labels.length === 0 }" :aria-pressed="filters.labels.length === 0"
          @click="showAll()">All</button>
        <button v-for="c in choices" :key="c.label" type="button" class="chip" :class="{ chip_on: filters.labels.includes(c.label) }"
          :aria-pressed="filters.labels.includes(c.label)" @click="toggle(c.label)">
          <svg v-if="filters.labels.includes(c.label)" class="chip_tick" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>
          {{c.text}}
        </button>
      </div>

      <!-- only when it matters: two or more picked -->
      <div v-if="filters.labels.length > 1" class="match" role="radiogroup" aria-label="How to combine">
        <span class="match_label">Show clips with</span>
        <button type="button" class="match_option" :class="{ match_on: filters.match === 'any' }" role="radio" :aria-checked="filters.match === 'any'"
          @click="setMatch('any')">{{filters.labels.length === 2 ? 'either one' : 'any of these'}}</button>
        <button type="button" class="match_option" :class="{ match_on: filters.match === 'all' }" role="radio" :aria-checked="filters.match === 'all'"
          @click="setMatch('all')">{{filters.labels.length === 2 ? 'both together' : 'all together'}}</button>
      </div>

      <!-- when: a segmented control (the joined "pick one" bar phones use), so it reads as its own question,
           apart from the animal buttons. A rarer date from More filters leaves none of these picked and says so
           in the "Showing" line. -->
      <div class="segments" role="radiogroup" aria-label="When">
        <button type="button" class="segment" :class="{ segment_on: !hasDate(filters) }" role="radio" :aria-checked="!hasDate(filters)"
          @click="setWhen('')">Any time</button>
        <button v-for="c in mainWhen" :key="c.value" type="button" class="segment" :class="{ segment_on: filters.when === c.value }" role="radio"
          :aria-checked="filters.when === c.value" @click="setWhen(filters.when === c.value ? '' : c.value)">{{c.text}}</button>
      </div>

      <p class="summary" aria-live="polite">
        <span><span class="summary_label">Showing:</span> {{describe(filters)}}</span>
        <button v-if="hasFilters(filters)" type="button" class="link" @click="clearAll()">Clear filters</button>
        <button type="button" class="link link_more" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
          More filters<span v-if="moreCount"> ({{moreCount}})</span>
          <svg :class="{ flipped: moreOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </p>

      <div v-if="moreOpen" class="more">
        <div class="more_title">Other dates</div>
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

        <label v-if="mayHidePeople" class="switch">
          <input type="checkbox" :checked="hidingPeople" @change="toggleHidePeople()">
          <span class="switch_track" aria-hidden="true"><span class="switch_knob"></span></span>
          Hide clips with people
        </label>
      </div>
    </div>

    <MeEventList :meGroupText="meGroupText" :filters="filters" :key="listKey" @clear-date="setWhen('')" @clear-all="clearAll()" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { me, ANIMAL_LABELS } from '../ts/me';
import { MAIN_WHEN, WHEN_CHOICES, dateButtonText, describe, filtersFromUrl, filtersToUrl, hasDate, hasFilters, localDate, type Filters, type When } from '../ts/filters';
import MeEventList from './MeEventList.vue';

const props = defineProps<{
  meGroupText: string;
}>();

const filters = ref<Filters>(filtersFromUrl());
// a new list (and a new search) whenever the filters change
const listKey = computed(() => JSON.stringify(filters.value));

// The buttons, in the words people use. Deliveries only for a porch camera; friends (animals only) get only
// the animals. "Person" also finds the AI's "legs" (the server matches both).
const choices = computed(() => {
  const all = [
    { label: 'cat', text: 'Cats', color: 'var(--accent)' },
    { label: 'dog', text: 'Dogs', color: '#4f8df5' },
    { label: 'raccoon', text: 'Raccoons', color: '#a26bf0' },
    { label: 'person', text: 'People', color: '#2fb47c' },
    { label: 'delivery', text: 'Deliveries', color: '#e0613a' },
  ];
  return all.filter((c) => (c.label !== 'delivery' || props.meGroupText.includes('porch'))
    && (!me.value?.animalsOnly || ANIMAL_LABELS.includes(c.label)));
});
const mayHidePeople = computed(() => !me.value?.animalsOnly && !filters.value.labels.includes('person'));
const hidingPeople = computed(() => filters.value.without.includes('person'));

const mainWhen = WHEN_CHOICES.filter((c) => MAIN_WHEN.includes(c.value));
const moreWhen = WHEN_CHOICES.filter((c) => !MAIN_WHEN.includes(c.value));
// a date chosen under More filters (Past month, picked dates)
const otherDate = computed(() => hasDate(filters.value) && !MAIN_WHEN.includes(filters.value.when));

// "More filters" (rarer dates, hiding people): closed unless asked for; the count says how many are on
const moreOpen = ref(false);
const picking = ref(!!(filters.value.from || filters.value.to));
const moreCount = computed(() => (otherDate.value ? 1 : 0) + (hidingPeople.value ? 1 : 0));
const dateFrom = ref(filters.value.from);
const dateTo = ref(filters.value.to === filters.value.from ? '' : filters.value.to);
const today = localDate(new Date());

function update(change: Partial<Filters>): void {
  filters.value = { ...filters.value, ...change };
  if (filters.value.labels.length < 2) filters.value.match = 'any';
  filtersToUrl(filters.value);
}

function showAll(): void {
  update({ labels: [] });
}
function toggle(label: string): void {
  const on = filters.value.labels.includes(label);
  const labels = on ? filters.value.labels.filter((l) => l !== label) : [...filters.value.labels, label];
  // picking People undoes "Hide people"
  const without = label === 'person' && !on ? filters.value.without.filter((l) => l !== 'person') : filters.value.without;
  update({ labels, without });
}
function toggleHidePeople(): void {
  update({ without: hidingPeople.value ? filters.value.without.filter((l) => l !== 'person') : [...filters.value.without, 'person'] });
}
function setMatch(match: 'any' | 'all'): void {
  update({ match });
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
  update({ labels: [], match: 'any', without: [], when: '', from: '', to: '' });
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

.segments {
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  max-width: 520px;
  padding: 4px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.segment {
  min-height: 40px;
  padding: 0 6px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.segment:hover {
  color: var(--text);
}

.segment:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.segment_on,
.segment_on:hover {
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
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



.match {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.match_label {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.match_option {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
}

.match_on {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
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

.link_more {
  color: var(--text-muted);
}

.link_more svg {
  transition: transform 0.15s;
}

.link_more svg.flipped {
  transform: rotate(180deg);
}

.more {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.more_title {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

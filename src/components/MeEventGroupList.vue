<template>
  <section class="cmo_event_group">
    <div class="group_header">
      <!-- MeGroupList puts its camera picker here -->
      <slot name="title"><h2 class="group_title">{{meGroupText.replace(/_/g, " ")}}</h2></slot>
    </div>

    <!-- Filters the way photo and shopping apps do them: the choices are all in sight as buttons; tap one to
         turn it on (filled), tap again to turn it off. "All" clears the animal choices. -->
    <div class="filters">
      <div class="chip_row" role="group" aria-label="What to show">
        <button type="button" class="chip" :class="{ chip_on: filters.labels.length === 0 }" :aria-pressed="filters.labels.length === 0"
          @click="showAll()">All</button>
        <button v-for="c in choices" :key="c.label" type="button" class="chip" :class="{ chip_on: filters.labels.includes(c.label) }"
          :aria-pressed="filters.labels.includes(c.label)" @click="toggle(c.label)">
          <svg v-if="filters.labels.includes(c.label)" class="chip_tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>
          {{c.text}}
        </button>
      </div>

      <!-- when, and (for Mark) hiding people: their own line, so they're never off-screen on a phone -->
      <div class="chip_row" role="group" aria-label="When">
        <div class="date" ref="dateEl">
          <button type="button" class="chip chip_menu" :class="{ chip_on: hasDate(filters) }" :aria-expanded="dateOpen" aria-haspopup="true"
            @click="dateOpen = !dateOpen">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            {{dateButtonText(filters)}}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>

        <button v-if="mayHidePeople" type="button" class="chip" :class="{ chip_on: hidingPeople }" :aria-pressed="hidingPeople" @click="toggleHidePeople()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-3.2 4.3M6.3 6.3A13 13 0 0 0 2 12c1 2.5 5 7 10 7a9.8 9.8 0 0 0 4.5-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
          Hide people
        </button>
      </div>

      <!-- the date choices open under the row, full width, like a phone app's sheet -->
      <div v-if="dateOpen" class="date_menu" role="dialog" aria-label="Choose dates" @keydown.esc="dateOpen = false">
        <div class="date_quick">
          <button type="button" class="date_option" :class="{ date_option_on: !hasDate(filters) }" @click="setWhen('')">Any date</button>
          <button v-for="c in WHEN_CHOICES" :key="c.value" type="button" class="date_option" :class="{ date_option_on: filters.when === c.value }"
            @click="setWhen(c.value)">{{c.text}}</button>
        </div>
        <div class="date_custom">
          <div class="date_custom_title">Or pick dates</div>
          <div class="date_inputs">
            <label>From <input type="date" class="date_input" v-model="dateFrom" :max="today"></label>
            <label>To <input type="date" class="date_input" v-model="dateTo" :min="dateFrom" :max="today"></label>
          </div>
          <div class="date_hint">Leave "To" empty for just that one day.</div>
          <button type="button" class="btn btn_primary date_apply" :disabled="!dateFrom && !dateTo" @click="applyDates()">Show these dates</button>
        </div>
      </div>

      <!-- only when it matters: two or more animals picked -->
      <div v-if="filters.labels.length > 1" class="match" role="radiogroup" aria-label="How to combine">
        <span class="match_label">Show clips with</span>
        <button type="button" class="match_option" :class="{ match_on: filters.match === 'any' }" role="radio" :aria-checked="filters.match === 'any'"
          @click="setMatch('any')">{{filters.labels.length === 2 ? 'either one' : 'any of these'}}</button>
        <button type="button" class="match_option" :class="{ match_on: filters.match === 'all' }" role="radio" :aria-checked="filters.match === 'all'"
          @click="setMatch('all')">{{filters.labels.length === 2 ? 'both together' : 'all together'}}</button>
      </div>

      <p class="summary" aria-live="polite">
        <span><span class="summary_label">Showing:</span> {{describe(filters)}}</span>
        <button v-if="hasFilters(filters)" type="button" class="summary_clear" @click="clearAll()">Clear filters</button>
      </p>
    </div>

    <MeEventList :meGroupText="meGroupText" :filters="filters" :key="listKey" @clear-date="setWhen('')" @clear-all="clearAll()" />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { me, ANIMAL_LABELS } from '../ts/me';
import { WHEN_CHOICES, dateButtonText, describe, filtersFromUrl, filtersToUrl, hasDate, hasFilters, localDate, type Filters, type When } from '../ts/filters';
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
    { label: 'cat', text: 'Cats' },
    { label: 'dog', text: 'Dogs' },
    { label: 'raccoon', text: 'Raccoons' },
    { label: 'person', text: 'People' },
    { label: 'delivery', text: 'Deliveries' },
  ];
  return all.filter((c) => (c.label !== 'delivery' || props.meGroupText.includes('porch'))
    && (!me.value?.animalsOnly || ANIMAL_LABELS.includes(c.label)));
});
const mayHidePeople = computed(() => !me.value?.animalsOnly && !filters.value.labels.includes('person'));
const hidingPeople = computed(() => filters.value.without.includes('person'));

const dateOpen = ref(false);
const dateEl = ref<HTMLElement | null>(null);
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
  dateOpen.value = false;
}
function applyDates(): void {
  // one date is that day; two are a range (in either order)
  let from = dateFrom.value || dateTo.value, to = dateTo.value || dateFrom.value;
  if (from > to) [from, to] = [to, from];
  update({ when: '', from, to });
  dateOpen.value = false;
}
function clearAll(): void {
  dateFrom.value = '';
  dateTo.value = '';
  update({ labels: [], match: 'any', without: [], when: '', from: '', to: '' });
}

// a tap outside the date choices closes them
function onDocClick(e: MouseEvent): void {
  const t = e.target as HTMLElement;
  if (dateOpen.value && dateEl.value && !dateEl.value.contains(t) && !t.closest('.date_menu')) dateOpen.value = false;
}
document.addEventListener('click', onDocClick);
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
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
  gap: 8px;
}

.chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
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


.date_menu {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
  box-shadow: var(--shadow);
}

.date_quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.date_option {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.95rem;
}

.date_option:hover {
  border-color: var(--text-muted);
}

.date_option_on,
.date_option_on:hover {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-contrast);
}

.date_custom {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.date_custom_title {
  font-weight: 600;
}

.date_inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.date_inputs label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
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

.date_apply {
  justify-self: start;
}

.date_apply:disabled {
  opacity: 0.5;
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
  font-size: 0.95rem;
}

.summary span {
  color: var(--text);
}

.summary .summary_label {
  color: var(--text-muted);
}

.summary_clear {
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 500;
}

.summary_clear:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>

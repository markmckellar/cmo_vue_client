<template>
  <section class="cmo_event_group">
    <div class="group_header">
      <!-- MeGroupList puts its camera picker here -->
      <slot name="title"><h2 class="group_title">{{meGroupText.replace(/_/g, " ")}}</h2></slot>
    </div>

    <!-- Filters stack like a search site's: each one is a chip with an ✕, and "Add filter" adds another -->
    <div class="filter_bar">
      <span v-for="(label, i) in filters.labels" :key="'has:' + label" class="chip_group">
        <span v-if="i > 0" class="chip_join">{{filters.match === 'all' ? 'and' : 'or'}}</span>
        <span class="chip">
          {{cap(label)}}
          <button type="button" class="chip_x" :aria-label="`Remove ${label}`" @click="removeLabel(label)">✕</button>
        </span>
      </span>
      <span v-for="label in filters.without" :key="'not:' + label" class="chip chip_not">
        No {{label}}
        <button type="button" class="chip_x" :aria-label="`Remove no ${label}`" @click="removeWithout(label)">✕</button>
      </span>
      <span v-if="filters.from || filters.to" class="chip chip_date">
        {{dateChipText(filters)}}
        <button type="button" class="chip_x" aria-label="Remove the date" @click="removeDate()">✕</button>
      </span>

      <div class="add" ref="addEl">
        <button type="button" class="add_button" :aria-expanded="adding" @click="adding = !adding">
          <span aria-hidden="true">+</span> Add filter
        </button>
        <div v-if="adding" class="add_menu" role="dialog" aria-label="Add a filter" @keydown.esc="adding = false">
          <div class="menu_section">
            <div class="menu_title">Show</div>
            <div class="menu_options">
              <button v-for="label in labelsLeft" :key="label" type="button" class="option" @click="addLabel(label)">{{cap(label)}}</button>
              <span v-if="labelsLeft.length === 0" class="menu_none">All added</span>
            </div>
          </div>
          <div class="menu_section">
            <div class="menu_title">Without</div>
            <div class="menu_options">
              <button v-for="label in labelsLeft" :key="label" type="button" class="option option_not" @click="addWithout(label)">No {{label}}</button>
              <span v-if="labelsLeft.length === 0" class="menu_none">All added</span>
            </div>
          </div>
          <div class="menu_section">
            <div class="menu_title">Date</div>
            <div class="menu_dates">
              <label>On or from <input type="date" class="date" v-model="dateFrom" :max="today"></label>
              <label>to <span class="muted">(optional)</span> <input type="date" class="date" v-model="dateTo" :min="dateFrom" :max="today"></label>
              <button type="button" class="btn date_apply" :disabled="!dateFrom && !dateTo" @click="applyDate()">
                {{dateFrom && !dateTo ? 'Just that day' : 'Use these dates'}}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button v-if="filters.labels.length > 1" type="button" class="match_toggle" @click="toggleMatch()"
        :title="filters.match === 'all' ? 'Showing clips with all of them at once' : 'Showing clips with any of them'">
        {{filters.match === 'all' ? 'All of them in one clip' : 'Any of them'}} <span aria-hidden="true">⇄</span>
      </button>
      <button v-if="hasFilters(filters)" type="button" class="clear_all" @click="clearAll()">Clear all</button>
    </div>

    <MeEventList :meGroupText="meGroupText" :filters="filters" :key="listKey" />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { CLASSIFICATIONS } from '../ts/meollama';
import { me, ANIMAL_LABELS } from '../ts/me';
import { dateChipText, filtersFromUrl, filtersToUrl, hasFilters, type Filters } from '../ts/filters';
import MeEventList from './MeEventList.vue';

defineProps<{
  meGroupText: string;
}>();

const filters = ref<Filters>(filtersFromUrl());
// a new list (and a new search) whenever the filters change
const listKey = computed(() => JSON.stringify(filters.value));

const adding = ref(false);
const addEl = ref<HTMLElement | null>(null);
const dateFrom = ref(filters.value.from);
const dateTo = ref(filters.value.to === filters.value.from ? '' : filters.value.to);
const today = localDate(new Date());

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// the classifications we know; people who only see animals (friends) get only the animal ones
const knownLabels = computed<string[]>(() => CLASSIFICATIONS.map((c) => c.label)
  .filter((label) => !me.value?.animalsOnly || ANIMAL_LABELS.includes(label)));
// a label is either shown or left out, not both
const labelsLeft = computed(() => knownLabels.value.filter((l) => !filters.value.labels.includes(l) && !filters.value.without.includes(l)));

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function update(change: Partial<Filters>): void {
  filters.value = { ...filters.value, ...change };
  if (filters.value.labels.length < 2) filters.value.match = 'any';
  filtersToUrl(filters.value);
}

function addLabel(label: string): void {
  update({ labels: [...filters.value.labels, label] });
  adding.value = false;
}
function removeLabel(label: string): void {
  update({ labels: filters.value.labels.filter((l) => l !== label) });
}
function addWithout(label: string): void {
  update({ without: [...filters.value.without, label] });
  adding.value = false;
}
function removeWithout(label: string): void {
  update({ without: filters.value.without.filter((l) => l !== label) });
}
function applyDate(): void {
  // one date is that day; two are a range (in either order)
  let from = dateFrom.value || dateTo.value, to = dateTo.value || dateFrom.value;
  if (from > to) [from, to] = [to, from];
  update({ from, to });
  adding.value = false;
}
function removeDate(): void {
  dateFrom.value = '';
  dateTo.value = '';
  update({ from: '', to: '' });
}
function toggleMatch(): void {
  update({ match: filters.value.match === 'all' ? 'any' : 'all' });
}
function clearAll(): void {
  dateFrom.value = '';
  dateTo.value = '';
  update({ labels: [], match: 'any', without: [], from: '', to: '' });
}

// a click outside the menu closes it
function onDocClick(e: MouseEvent): void {
  if (adding.value && addEl.value && !addEl.value.contains(e.target as Node)) adding.value = false;
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

.filter_bar {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.chip_group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.chip_join {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 12px;
  border: 1px solid var(--accent);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
}

.chip_not {
  border-color: var(--text-muted);
  border-style: dashed;
}

.chip_date {
  border-color: var(--text-muted);
}

.chip_x {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.chip_x:hover {
  background: var(--border);
  color: var(--text);
}

.add {
  position: relative;
}

.add_button {
  padding: 6px 14px;
  border: 1px dashed var(--text-muted);
  border-radius: 999px;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
}

.add_button:hover,
.add_button[aria-expanded="true"] {
  border-color: var(--accent);
  color: var(--accent);
}

.add_menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  display: grid;
  gap: 14px;
  width: min(340px, calc(100vw - 32px));
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  box-shadow: var(--shadow);
}

.menu_title {
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.menu_options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.menu_none,
.muted {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.option {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
}

.option:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.option_not {
  border-style: dashed;
}

.menu_dates {
  display: grid;
  gap: 8px;
  font-size: 0.9rem;
}

.menu_dates label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.date {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  color-scheme: dark;
}

.date_apply {
  justify-self: start;
  padding: 6px 16px;
}

.date_apply:disabled {
  opacity: 0.5;
}

.match_toggle {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font: inherit;
  font-size: 0.85rem;
}

.match_toggle:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.clear_all {
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.85rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.clear_all:hover {
  color: var(--accent);
}

/* phones: the menu spans the filter bar, so it never hangs off the screen */
@media (max-width: 600px) {
  .add {
    position: static;
  }

  .add_menu {
    right: 0;
    width: auto;
  }
}
</style>

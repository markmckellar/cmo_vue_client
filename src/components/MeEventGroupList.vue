<template>
  <section class="cmo_event_group">
    <div class="group_header">
      <!-- MeGroupList puts its camera picker here -->
      <slot name="title"><h2 class="group_title">{{meGroupText.replace(/_/g, " ")}}</h2></slot>
      <div class="group_controls">
        <p class="controls_hint">Show events <b>by classification</b> across all dates, <em>or</em> pick a single <b>date</b>.</p>
        <div class="control" :class="{ control_active: searchLabel }">
          <span class="control_label">By classification</span>
          <form class="search" role="search" @submit.prevent="runSearch()">
            <input class="search_input" type="search" v-model="searchText" autocomplete="off"
              placeholder="cat, dog, person…" enterkeyhint="search" aria-label="Search by classification"
              @focus="showSuggestions = true" @input="showSuggestions = true" @blur="showSuggestions = false" @keydown.esc="showSuggestions = false">
            <!-- datalist is unreliable on mobile Chrome, so the suggestions are our own list -->
            <ul v-if="showSuggestions && suggestions.length" class="suggestions" role="listbox">
              <li v-for="label in suggestions" :key="label" role="option">
                <button type="button" class="suggestion" @pointerdown.prevent @click="pickLabel(label)">{{label}}</button>
              </li>
            </ul>
            <button class="search_button" type="submit" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
          </form>
        </div>
        <span class="controls_or" aria-hidden="true">or</span>
        <label class="control" :class="{ control_active: !searchLabel, control_off: searchLabel }">
          <span class="control_label">By date</span>
          <select class="select" v-model="selectedMeEventGroupText" :disabled="!!searchLabel">
            <option v-for="(meEventGroup, index) in fileList" v-bind:key="index">{{meEventGroup.meEventGroup}}</option>
          </select>
          <span v-if="searchLabel" class="control_note">Clear the search to choose a date</span>
        </label>
      </div>
    </div>

    <div v-if="searchLabel" class="search_banner">
      <span>Showing every <b>{{searchLabel}}</b> event from all dates</span>
      <button class="search_clear" @click="clearSearch()">Clear search and browse by date</button>
    </div>

    <MeEventList v-if="searchLabel" :meGroupText="meGroupText" meEventGroupText="" :searchLabel="searchLabel" :key="`search:${searchLabel}`" />
    <MeEventList v-else-if="getSelectedMeEventGroup()" :meGroupText="meGroupText" :meEventGroupText="getSelectedMeEventGroup()" :key="selectedMeEventGroupText" />
    <div v-else class="group_empty">No event group selected</div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CatCamServices, CMO_SERVER } from '../ts/catcamservices';
import type { MeEventGroup } from '../ts/meeventgroup';
import { CLASSIFICATIONS } from '../ts/meollama';
import MeEventList from './MeEventList.vue';

const props = withDefaults(defineProps<{
  meGroupText: string;
  howManyRecords?: number;
}>(), {
  howManyRecords: 24,
});

const selectedMeEventGroupText = ref("");
const meEventGroup = ref<MeEventGroup>({meEventGroup:""});
const fileList = ref<MeEventGroup[]>([]);
const searchText = ref("");
const searchLabel = ref("");
// suggestions for the search box; the server matches any label ollama writes
const knownLabels = CLASSIFICATIONS.map((c) => c.label);
const showSuggestions = ref(false);

const suggestions = computed<string[]>(() => {
  const text = searchText.value.trim().toLowerCase();
  return knownLabels.filter((label) => label.startsWith(text) && label !== text);
});

function runSearch():void {
  searchLabel.value = searchText.value.trim().toLowerCase();
  showSuggestions.value = false;
}

function pickLabel(label: string):void {
  searchText.value = label;
  runSearch();
  (document.activeElement as HTMLElement | null)?.blur();
}

function clearSearch():void {
  searchText.value = "";
  searchLabel.value = "";
}

// emptying the box (or its ✕) goes back to browsing by date
watch(searchText, (text: string) => {
  if(!text.trim()) searchLabel.value = "";
});

function getSelectedMeEventGroup():string {
  console.log(`getSelectedMeEventGroup:START numRecords=${fileList.value.length} selectedMeEventGroupText=${selectedMeEventGroupText.value}`);
  return(selectedMeEventGroupText.value);
}

function geMeEventGroupList(): void {
  console.log(`geMeEventGroupList meGroup=${props.meGroupText}`);
  if(props.meGroupText) new CatCamServices(CMO_SERVER).getMeEventGroupList(
    props.meGroupText,
    props.howManyRecords).then((meEventGroupList) => {
      fileList.value = meEventGroupList;
      if(meEventGroupList.length>0) meEventGroup.value = meEventGroupList[0];
      selectedMeEventGroupText.value = meEventGroup.value.meEventGroup;
      console.log("geMeEventGroupList="+JSON.stringify(meEventGroupList));
    });
}

geMeEventGroupList();
</script>

<style scoped>
.group_header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  margin-bottom: 20px;
}

.group_title {
  font-size: 1.5rem;
  text-transform: capitalize;
}

.group_controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 16px;
}

.controls_hint {
  flex-basis: 100%;
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.controls_hint b {
  color: var(--text);
  font-weight: 500;
}

.controls_or {
  padding-bottom: 8px;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  transition: opacity 0.15s;
}

.control_label {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.control_active .control_label {
  color: var(--accent);
}

.control_off .select {
  opacity: 0.4;
}

.control_note {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.search {
  position: relative;
  display: flex;
  align-items: center;
}

.search_input {
  width: 260px;
  padding: 8px 42px 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
}

.search_input::placeholder {
  color: var(--text-muted);
}

.search_input:hover {
  border-color: var(--text-muted);
}

.search_input:focus {
  outline: none;
  border-color: var(--accent);
}

.search_button {
  position: absolute;
  right: 4px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-contrast);
}

.search_button:hover {
  background: var(--accent-hover);
}

.search_button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 10;
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  box-shadow: var(--shadow);
}

.suggestion {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--text);
  text-align: left;
  text-transform: capitalize;
}

.suggestion:hover,
.suggestion:focus-visible {
  outline: none;
  background: var(--border);
  color: var(--accent);
}

.search_banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 18px;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-muted);
}

.search_banner b {
  color: var(--accent);
  text-transform: capitalize;
}

.search_clear {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.search_clear:hover {
  color: var(--accent);
}

.group_empty {
  padding: 48px 16px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  text-align: center;
}

@media (max-width: 600px) {
  .group_controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control,
  .search,
  .search_input,
  .control .select {
    width: 100%;
  }

  .controls_or {
    padding: 0;
    text-align: center;
  }
}
</style>

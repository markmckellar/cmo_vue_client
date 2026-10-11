<template>
  <section class="cmo_event_group">
    <div class="group_header">
      <h2 class="group_title">{{meGroupText.replace(/_/g, " ")}}</h2>
      <div class="group_controls">
        <form class="search" role="search" @submit.prevent="runSearch()">
          <input class="search_input" type="search" v-model="searchText" :list="`labels-${meGroupText}`"
            placeholder="Search all dates (cat, dog…)" enterkeyhint="search" aria-label="Search by classification">
          <datalist :id="`labels-${meGroupText}`">
            <option v-for="label in knownLabels" :key="label" :value="label" />
          </datalist>
          <button class="search_button" type="submit" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
        </form>
        <label class="group_picker" :class="{ group_picker_off: searchLabel }">
          <span class="group_picker_label">Event group</span>
          <select class="select" v-model="selectedMeEventGroupText" :disabled="!!searchLabel">
            <option v-for="(meEventGroup, index) in fileList" v-bind:key="index">{{meEventGroup.meEventGroup}}</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="searchLabel" class="search_banner">
      <span>Every <b>{{searchLabel}}</b> event, all dates</span>
      <button class="search_clear" @click="clearSearch()">Clear search</button>
    </div>

    <MeEventList v-if="searchLabel" :meGroupText="meGroupText" meEventGroupText="" :searchLabel="searchLabel" :key="`search:${searchLabel}`" />
    <MeEventList v-else-if="getSelectedMeEventGroup()" :meGroupText="meGroupText" :meEventGroupText="getSelectedMeEventGroup()" :key="selectedMeEventGroupText" />
    <div v-else class="group_empty">No event group selected</div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { CatCamServices } from '../ts/catcamservices';
import type { MeEventGroup } from '../ts/meeventgroup';
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
const knownLabels = ['cat', 'dog', 'person', 'raccoon', 'animal', 'legs'];

function runSearch():void {
  searchLabel.value = searchText.value.trim().toLowerCase();
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
  if(props.meGroupText) new CatCamServices('http://173.255.215.223:9090/').getMeEventGroupList(
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
  align-items: center;
  gap: 12px 20px;
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

.group_picker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  transition: opacity 0.15s;
}

.group_picker_off {
  opacity: 0.4;
}

.group_picker_label {
  color: var(--text-muted);
  font-size: 0.85rem;
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
  .group_controls,
  .search,
  .search_input {
    width: 100%;
  }
}
</style>

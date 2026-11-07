<template>
  <section class="cmo_event_group">
    <div class="group_header">
      <!-- MeGroupList puts its camera picker here -->
      <slot name="title"><h2 class="group_title">{{meGroupText.replace(/_/g, " ")}}</h2></slot>
      <div class="group_controls">
        <p class="controls_hint">Show events <b>by classification</b> across all dates, <em>or</em> pick a single <b>date</b>.</p>
        <label class="control" :class="{ control_active: searchLabel }">
          <span class="control_label">By classification</span>
          <!-- only the classifications we know, so nothing has to be typed or spelled right -->
          <select class="select" v-model="searchLabel" aria-label="Show events by classification">
            <option value="">Any (browse by date)</option>
            <option v-for="label in labels" :key="label" :value="label">{{label.charAt(0).toUpperCase() + label.slice(1)}}</option>
          </select>
        </label>
        <span class="controls_or" aria-hidden="true">or</span>
        <label class="control" :class="{ control_active: !searchLabel, control_off: searchLabel }">
          <span class="control_label">By date</span>
          <select class="select" v-model="selectedMeEventGroupText" :disabled="!!searchLabel">
            <option v-for="(meEventGroup, index) in fileList" v-bind:key="index">{{meEventGroup.meEventGroup}}</option>
          </select>
          <span v-if="searchLabel" class="control_note">Set classification to Any to choose a date</span>
        </label>
      </div>
    </div>

    <div v-if="searchLabel" class="search_banner">
      <span>Showing every <b>{{searchLabel}}</b> event from all dates</span>
      <button class="search_clear" @click="clearSearch()">Browse by date instead</button>
    </div>

    <MeEventList v-if="searchLabel" :meGroupText="meGroupText" meEventGroupText="" :searchLabel="searchLabel" :key="`search:${searchLabel}`" />
    <MeEventList v-else-if="getSelectedMeEventGroup()" :meGroupText="meGroupText" :meEventGroupText="getSelectedMeEventGroup()" :key="selectedMeEventGroupText" />
    <div v-else class="group_empty">No event group selected</div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CatCamServices, CMO_SERVER } from '../ts/catcamservices';
import type { MeEventGroup } from '../ts/meeventgroup';
import { CLASSIFICATIONS } from '../ts/meollama';
import { me, ANIMAL_LABELS } from '../ts/me';
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
const searchLabel = ref("");
// the classifications to offer; people who only see animals (friends) get only the animal ones
const labels = computed<string[]>(() => CLASSIFICATIONS.map((c) => c.label)
  .filter((label) => !me.value?.animalsOnly || ANIMAL_LABELS.includes(label)));

function clearSearch():void {
  searchLabel.value = "";
}

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
  .control .select {
    width: 100%;
  }

  .controls_or {
    padding: 0;
    text-align: center;
  }
}
</style>

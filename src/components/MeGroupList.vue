<template>
  <div class="cmo_source">
    <!-- one camera at a time; :key starts the event list over when the camera changes -->
    <MeEventGroupList v-if="selectedMeGroup" :meGroupText="selectedMeGroup" :key="selectedMeGroup">
      <template #title>
        <label class="camera_picker">
          <span class="camera_label">Camera</span>
          <select class="select camera_select" v-model="selectedMeGroup" aria-label="Camera">
            <option v-for="meGroup in fileList" :key="meGroup.meGroup" :value="meGroup.meGroup">
              {{cameraName(meGroup.meGroup)}}
            </option>
          </select>
        </label>
      </template>
    </MeEventGroupList>
    <div v-else-if="loaded" class="group_empty">No cameras found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { CatCamServices, CMO_SERVER } from '../ts/catcamservices';
import type { MeGroup } from '../ts/megroup';
import MeEventGroupList from './MeEventGroupList.vue';

const STORAGE_KEY = 'cmo_selected_camera';

const fileList = ref<MeGroup[]>([]);
const selectedMeGroup = ref("");
const loaded = ref(false);

function cameraName(meGroup: string): string {
  const name = meGroup.replace(/_/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function rememberedCamera(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

// keep the viewer's camera across visits
watch(selectedMeGroup, (meGroup: string) => {
  try {
    if(meGroup) localStorage.setItem(STORAGE_KEY, meGroup);
  } catch {
    // storage blocked (private window): just don't remember
  }
});

function geMeGroupList(): void {
  new CatCamServices(CMO_SERVER).getMeGroupList().then((meGroupList) => {
    // the server lists everything in its upload dir, including loose files (helloworld.jpeg):
    // only names without a dot are cameras
    fileList.value = meGroupList.filter((meGroup) => !meGroup.meGroup.includes("."));
    const names = fileList.value.map((meGroup) => meGroup.meGroup);
    const remembered = rememberedCamera();
    selectedMeGroup.value = names.includes(remembered) ? remembered : (names[0] ?? "");
    loaded.value = true;
    console.log("geMeGroupList="+JSON.stringify(meGroupList));
  });
}

geMeGroupList();
</script>

<style scoped>
.cmo_source {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.camera_picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.camera_label {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* reads as the section heading, like the "Pet door" title it replaces */
.camera_select {
  min-width: 200px;
  font-size: 1.25rem;
  font-weight: 600;
}

.group_empty {
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .camera_picker,
  .camera_select {
    width: 100%;
  }
}
</style>

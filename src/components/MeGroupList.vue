<template>
  <div class="cmo_source">
    <!-- the cameras are filters too (in MeEventGroupList), all of them on to start; with one camera (e.g. a
         friend) there's nothing to choose, so it's just a heading -->
    <MeEventGroupList v-if="cameras.length" :meGroupText="cameras.length === 1 ? cameras[0]! : ALL_CAMERAS" :cameras="cameras" :cameraInfo="info">
      <template #title>
        <h2 v-if="cameras.length === 1" class="camera_only">{{cameraName(cameras[0]!)}}</h2>
        <span v-else></span>
      </template>
    </MeEventGroupList>
    <div v-else-if="loaded" class="group_empty">No cameras found</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ALL_CAMERAS, CatCamServices, CMO_SERVER, cameraName } from '../ts/catcamservices';
import MeEventGroupList from './MeEventGroupList.vue';
import type { MeGroup } from '../ts/megroup';

const cameras = ref<string[]>([]);
const info = ref<Record<string, MeGroup>>({});
const loaded = ref(false);

new CatCamServices(CMO_SERVER).getMeGroupList().then((meGroupList) => {
  // the server lists everything in its upload dir, including loose files (helloworld.jpeg): only names without
  // a dot are cameras
  const groups = meGroupList.filter((g) => !g.meGroup.includes("."));
  cameras.value = groups.map((g) => g.meGroup);
  info.value = Object.fromEntries(groups.map((g) => [g.meGroup, g]));
  loaded.value = true;
});
</script>

<style scoped>
.cmo_source {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.camera_only {
  margin: 0;
  font-size: 1.6rem;
}

.group_empty {
  padding: 48px 16px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  text-align: center;
}
</style>

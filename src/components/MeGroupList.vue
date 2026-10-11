<template>
  <div class="cmo_source">
    <MeEventGroupList v-for="(meGroup, index) in fileList" :key="index" :meGroupText="meGroup.meGroup" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CatCamServices } from '../ts/catcamservices';
import type { MeGroup } from '../ts/megroup';
import MeEventGroupList from './MeEventGroupList.vue';

const fileList = ref<MeGroup[]>([]);

function geMeGroupList(): void {
  new CatCamServices('http://173.255.215.223:9090/').getMeGroupList().then((meGroupList) => {
    fileList.value = meGroupList;
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
</style>

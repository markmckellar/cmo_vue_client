<template>
  <div class="all_groups">
    <div id="app">
      <MeGroupList />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
// import BootstrapVue from 'bootstrap-vue/dist/bootstrap-vue.esm';
// import App from 'App.vue';
// import BootstrapVue from 'bootstrap-vue/dist/bootstrap-vue.esm';
//  @changeMeEventGroup="changeMeEventGroup($event)"
//     <MeEventList :meGroupEvent="20200327" @changeMeEventGroup="changeMeEventGroup($event)" />
//     <MeEventList @changeMeEventGroup="changeMeEventGroup($event)" />

// Import the styles directly. (Or you could add them via script tags.)
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';


import HelloWorld from './components/HelloWorld.vue';
import MeGroupList from './components/MeGroupList.vue';
import MeEventGroupList from './components/MeEventGroupList.vue';
import MeEventList from './components/MeEventList.vue';

@Component({
  components: {
    MeGroupList,MeEventGroupList
  },
})
// @Component({
//   components: {
//     MeGroupList,MeEventGroupList,MeEventList
//   },
// })
export default class App extends Vue {}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: #2c3e50;
  padding: 30px;
}

.all_groups {
  color: #2c3e50;
  background-color: #2c3e50;
}
</style>

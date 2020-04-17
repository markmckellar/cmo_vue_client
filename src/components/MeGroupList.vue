<template>
  <div class="cmo_source">
      <div  v-for="(meGroup, index) in fileList" v-bind:key="index">

        <div>
          <div></div>
          <div><MeEventGroupList :meGroupText="meGroup.meGroup"/></div>
        </div>
      
      </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { CatCamServices } from '../ts/catcamservices';
import { MeGroup } from '../ts/megroup';
// import MeEventGroupList from './components/MeEventGroupList.vue';
// import MeEventList from './components/MeEventList.vue';

// @Component({
//   components: {
//     MeEventGroupList,MeEventList
//   },
// })
import MeEventGroupList from './MeEventGroupList.vue';
@Component({
  components: {
    MeEventGroupList
  },
})
export default class MeGroupList extends Vue {


  public fileList = this.geMeGroupList();
    // @Prop({default: "pet_door"}) meGroup: string = "pet_door";


    public openMovie(meGroup:MeGroup): void {
      // this.meGroup = meGroup.meGroup;
    }


  public geMeGroupList(): MeGroup[] {
    
    const self = this;
    new CatCamServices('http://192.168.1.177:9090/').getMeGroupList().then((meGroupList) => {
        self.fileList = meGroupList;
        console.log("geMeGroupList="+JSON.stringify(meGroupList));
       } );
    return(new Array<MeGroup>());
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.cmo_source {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;  
  color: black;
  background-color: #ffffff;

  padding: 20px;
  border-width:1px;
  border-style:solid;
  border-color:black;
  }

</style>

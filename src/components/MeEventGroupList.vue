<template>
    
    <div class="cmo_event_group">
        <h2>{{meGroupText}}

        <select v-model="selectedMeEventGroupText">
                <option  v-for="(meEventGroup, index) in fileList" v-bind:key="index">{{meEventGroup.meEventGroup}}</option>
        </select>
        </h2>

        <div v-if="getSelectedMeEventGroup()">
            <MeEventList :meGroupText="meGroupText" :meEventGroupText="getSelectedMeEventGroup()" :key="selectedMeEventGroupText" />       
        </div>
        <div v-else>No event group selected</div>
        <!-- <div>
            <MeEventList :meGroupText="meGroupText" :meEventGroupText="meEventGroup.meEventGroup" />       
        </div> -->
 
    </div>

</template>

<script lang="ts">
import { Component, Prop, Emit, Vue } from 'vue-property-decorator';
import { CatCamServices } from '../ts/catcamservices';
import { MeEventGroup } from '../ts/meeventgroup';
import MeEventList from './MeEventList.vue';
import { Utils } from '../ts/utils';
@Component({
  components: {
    MeEventList
  },
})


  
export default class MeEventGroupList extends Vue {
  public selectedMeEventGroupText = "";
  public meEventGroup:MeEventGroup = {meEventGroup:""};
  public fileList = this.geMeEventGroupList();
  @Prop() public meGroupText!: string;
  
  @Prop({default: 24}) public howManyRecords: number = 24;

public getSelectedMeEventGroup():string {
       console.log(`getSelectedMeEventGroup:START numRecords=${this.fileList.length} selectedMeEventGroupText=${this.selectedMeEventGroupText}`);
       return(this.selectedMeEventGroupText);

}
  // public getSelectedMeEventGroup(index:number):string {
  //   console.log(`getSelectedMeEventGroup:START index=${index} numRecords=${this.fileList.length} meEventGroupText=${meEventGroupText}`);
  
  //   let meEventGroupText = (index>=0) ? this.fileList[index].meEventGroup :  "";
  //   console.log(`getSelectedMeEventGroup:selectedMeEventGroup=${this.selectedMeEventGroup} index=${index} numRecords=${this.fileList.length} meEventGroupText=${meEventGroupText}`);
  //   console.log();
  //   return(meEventGroupText);
  // }

  public changeMgEventGroup(e:any):void {
   let selectedIndex = e.target.options.selectedIndex;
   if(selectedIndex > -1) {
      if(this.fileList) this.meEventGroup = this.fileList[selectedIndex];
   }
  }

  public getUtils():Utils {
    return(new Utils());
  }

  public geMeEventGroupList(): MeEventGroup[] {
    
    const self = this;
    
    console.log(`geMeEventGroupList meGroup=${this.meGroupText}`);
    if(this.meGroupText) new CatCamServices('http://192.168.1.177:9090/').getMeEventGroupList(
      this.meGroupText,
      this.howManyRecords).then((meEventGroupList) => {
        self.fileList = meEventGroupList;
        if(self.fileList.length>0) self.meEventGroup = self.fileList[0];
        self.selectedMeEventGroupText = self.meEventGroup.meEventGroup;
        console.log("geMeEventGroupList="+JSON.stringify(meEventGroupList));
       } );
    return(new Array<MeEventGroup>());
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.cmo_event_group {
}


</style>

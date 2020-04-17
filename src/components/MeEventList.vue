<template>
  <div  class="cmo_div_outer">

    <div v-if="isDialogActive()">
          <div class="cmo img movie_box_center">
          <MeEventDetail :meEvent="getCurrentMovie()" />
          <center><button @click="closeDialog()">close</button></center>
          </div>
    </div>
    <div v-else>
    </div>

    <div>
        <div class="cmo_div_wrapper" v-for="(meEvent, index) in fileList" v-bind:key="index">
                
          <div class="cmo_div" @click="watchMovie(meEvent)">
              <div><b>{{getTimePassedToMe(meEvent,index)}} ago at {{getDateTime(meEvent)}}<br>
                {{meEvent.me_time.toFixed(1)}} seconds (click to watch video)</b></div>
              <div>
               <img class="cmo_img" v-bind:src="getRepImageSrc(meEvent)">
              </div>
               <div><b>{{getTime2PreviousMe(meEvent,index)}}</b></div>
          </div>
        </div>

        <br><center><button @click="getMore()">...more...</button></center>

    </div>

  </div>
</template>

<script lang="ts">
// http://192.168.1.177:9090/catcam/data/pet_door/20200326/20200326_234655_0310/images/00000.jpg
//        <MeEventDetail :meEvent="getCurrentMovie()" />
//             <img class="movie_container_overlay" src="@/assets/images/playbutton.png" />

// Vue.component("modal", {
//   template: "#modal-template"
// });
/*
window.onscroll = () => {
  let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight;

  if (bottomOfWindow) {
    // Do something, anything!
  }
};
*/

import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import { CatCamServices } from '../ts/catcamservices';
import { MeEvent } from '../ts/meevent';
import { MeEventImp } from '../ts/meeventimp';
import { Utils } from '../ts/utils';
import { MeEventGroup } from '../ts/meeventgroup';
import MeEventDetail from './MeEventDetail.vue';
@Component({
  components: {
    MeEventDetail,
  },
})
export default class MeEventList extends Vue {
 

 
  public fileList = this.geMeEventList();
  
  @Prop() public meGroupText!: string;
  @Prop() public meEventGroupText!: string;
  @Prop({default: 8}) public howMayRecords: number = 8;
  // @Prop({default: 0}) public startRecord: number = 0;
  public startRecord = 0;
  @Prop({default: 6.0}) public minimumDuration: number = 2.0+2.0+2.0; // empty_start+2 seconds_of_video+empty_end

  public dialogActive: boolean = false;
  public currentMeEvent:MeEvent = MeEventImp.getNewEmptyMeEvent();

  // private mounted():void {
  //   console.log("mounted!!!!!!!!!!!!");
  //   let self = this;
  //   window.onscroll = () => {
  //     let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight;

  //     if (bottomOfWindow) {
  //       self.getMore();
  //       // Do something, anything!
  //       console.log("inside on scooooooooooooooooorl!!!!");
  //     }
  //   }
  // }

  public getTimePassedToMe(meEvent:MeEvent,index:number):string {
    let me = new MeEventImp(meEvent);
    let timePassed = 0;
    if(index>0) {
      let dateRecent = new Date(Date.now());
      let previousMeEvent = new MeEventImp(this.fileList[index-1]);
      let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
      timePassed = dateRecent.getTime()-dateLast.getTime();
    } else {
      let dateRecent = new Date(Date.now());
      let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
      timePassed = dateRecent.getTime()-dateLast.getTime();

      // console.log(`xxxx ${timePassed} dateRecent.getTime()=${dateRecent.getTime()} dateLast.getTime()=${dateLast.getTime()}`);
    }    
    let timePassedString = this.msToStringAgo(timePassed);
    
    return(timePassedString);
  }


    public getTime2PreviousMe(meEvent:MeEvent,index:number):string {
    let me = new MeEventImp(meEvent);
    let timePassed = 0;
    if(index<(this.fileList.length-1)) {
      let dateRecent = new Date(Date.now());
      let nextMeEvent = new MeEventImp(this.fileList[index+1]);
      dateRecent.setTime(Date.parse(nextMeEvent.getLastMeEventTime()));
      let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
      timePassed = dateLast.getTime()-dateRecent.getTime();
      return(`previous event ${this.msToStringAgo(timePassed)}`); 
    } else {
      let dateRecent = new Date(Date.now());
      let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
      timePassed = dateRecent.getTime()-dateLast.getTime();

      return("last event");
    } 
  } 

   public getTime2NextMe(meEvent:MeEvent,index:number):string {
    let me = new MeEventImp(meEvent);
    let timePassed = 0;
    if(index>0) {
      let dateRecent = new Date(Date.now());
      let previousMeEvent = new MeEventImp(this.fileList[index-1]);
      dateRecent.setTime(Date.parse(previousMeEvent.getLastMeEventTime()));
      let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
      timePassed = dateRecent.getTime()-dateLast.getTime();
      return(`next future event in ${this.msToStringAgo(timePassed)}`); 
    } else {
      let dateRecent = new Date(Date.now());
      let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
      timePassed = dateRecent.getTime()-dateLast.getTime();

      return("most recent event");
    }    

  }


  public msToStringAgo(timePassed:number):string {
    let timePassedString = "";
    let seconsPassed = timePassed/1000;
    let minutesPassed = seconsPassed/60;
    let hoursPassed = minutesPassed/60;
    let daysPassed = hoursPassed/24;


    if(seconsPassed<60) timePassedString = `${ Math.round(seconsPassed)} seconds`;
    else if(minutesPassed<10) timePassedString = `${ minutesPassed.toFixed(1)} minutes`;
    else if(minutesPassed<60) timePassedString = `${ minutesPassed.toFixed(0)} minutes`;
    else if(hoursPassed<4) timePassedString = `${ hoursPassed.toFixed(1)} hours`;
    else if(hoursPassed<24) timePassedString = `${ hoursPassed.toFixed(0)} hours`;
    else if(daysPassed<4) timePassedString = `${ daysPassed.toFixed(1)} days`;
    else timePassedString = `${ daysPassed.toFixed(0)} days`;

    return(timePassedString);
  }

  public getDateFromMeEvent(meEvent:MeEvent):string {
    return(new Utils().getDateFullFromMeEvent(meEvent));
  }
   public getDateTime(meEvent:MeEvent):string {
    return(new Utils().getDateTime(meEvent));
  }
  public isDialogActive():boolean {
    return(this.dialogActive);
  }

  public closeDialog():void {
    this.dialogActive = false;
  }

  public getCurrentMovie():MeEvent {
    return(this.currentMeEvent);
  }

  public watchMovie(meEvent:MeEvent) {
    this.currentMeEvent =  MeEventImp.getNewFromMeEvent(meEvent);
    this.dialogActive = true;
  }

  @Watch('meEventGroupText', { 
    immediate: true, deep: true 
  })
  public meEventGroupTextChanged(newVal: string):void {
    console.log(`meEventGroupText:Changed!!v newVal=${newVal}`);
    this.fileList = this.geMeEventList();
  }   

  public getRepImageSrc(meEvent:MeEvent):string {
    let url = `http://192.168.1.177:9090/catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/${meEvent.me_rep_image}`;
    return(url);
    }

  public getMovieHtml(meEVent:MeEvent):string {
    return(`<video controls :src="${this.getMovieSrc(meEVent)}" type="video/mp4">Your browser does not support the video tag.</video>`);
  } 

  public getMovieSrc(meEvent:MeEvent):string {
    let url = `http://192.168.1.177:9090/catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/${meEvent.me_video_name}`;
    return(url);
  }


  public changeinside(meEventGroup:MeEventGroup):void {
    console.log("woooo! got the emit");
  }


  public getMore():void {
    console.log("moooooooooooooooore");
    this.startRecord += this.howMayRecords;
    this.fileList = this.geMeEventList();
  }

  public geMeEventList(): MeEvent[] {
    
    const self = this;
    let returnArray = (self.fileList) ? self.fileList : new Array<MeEvent>();

    console.log(`geMeEventGroupList meGroup=${this.meGroupText} meGroupEvent=${this.meEventGroupText}`);
    new CatCamServices('http://192.168.1.177:9090/').getMeEventList(
                              this.meGroupText,
                              this.meEventGroupText,
                              this.howMayRecords,
                              (this.startRecord)?this.startRecord:0,
                              this.minimumDuration).then((meEventList) => {
        for (let me of meEventList) {
        // for(let i=0;i<meEventList.length;i++) { 
        //  let me = meEventList[i];
          self.fileList.push(me);
        }
       } );
    return(returnArray);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.cmo_div_wrapper {
  display: inline-block;
}

.cmo_div_outer {
}

.cmo_div {
  margin:4px;
  border-width:0px;
  border-style:solid;
  border-color:grey;
  color: black;
  background-color: silver;
  padding: 4px;
  display: inline-block;
}

.movie_box_center {
  position: fixed;
  width:100%;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  background: #ffffff;
  padding:5px;
  border-width:1px;
  border-style:solid;
  border-color:black;
}

.cmo_img {
    max-width: 100%;
    max-height: 100%;
}

.unactive_time_outer {
  text-align: center;
  display: inline-block;

  /* 
    border-width:0px;
  border-style:solid;
  border-color:grey;
  color: black;
  background-color: silver; */
  /* display: inline-block; */

}

.unactive_time_inner {
    margin:4px;

  text-align: center;
  display: inline-block; 
    border-color:grey;
  color: black;
    padding: 4px;

  background-color: silver;
  /* margin:4px;
    width:1%;

  border-width:0px;
  border-style:solid;
  border-color:grey;
  color: black;
  background-color: silver;
  padding: 4px;
  display: inline-block; */

}
</style>

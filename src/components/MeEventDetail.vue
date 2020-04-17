<template>
  <div class="cmo_img me_event_detail">
    <div>{{getDateFromMeEvent(meEvent)}} -- {{meEvent.me_time.toFixed(1)}} seconds<br>
        <video class="cmo_img" controls :src="getMovieSrc()" type="video/mp4">
      Your browser does not support the video tag.
        </video>
        <div class="cmo_wrap">
          <MeEventDetailGraph  :width="600" :height="100" :data="getChartData(meEvent)" :options="getChartOptions(meEvent)" />
        </div>
        <div>
        {{meEvent.me_delta_array.length}} frames fps={{ (meEvent.me_delta_array.length/meEvent.me_time).toFixed(0)}}  
        </div>
    </div>
      
  </div>
</template>

<script lang="ts">

import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import { CatCamServices } from '../ts/catcamservices';
import { MeEvent } from '../ts/meevent';
import { Utils } from '../ts/utils';
import MeEventDetailGraph from './MeEventDetailGraph.vue';

@Component({
  components: {
    MeEventDetailGraph,
  },
})
// @Component
export default class MeEventDetail extends Vue {

  @Prop() public meEvent!: MeEvent;
  
  public getChartData(meEvent:MeEvent):any {

    let labelData = new Array<string>();
    let yAreaCount = new Array<number>();
    let yAreaData = new Array<number>();

    let maxContourArea = 0;
    let maxContourCount = 0;
    for (let deltaArray of meEvent.me_delta_array) {
        
      if(deltaArray.contours.length>maxContourCount) maxContourCount = deltaArray.contours.length;
      
      let tempArea = 0;
      for (let c of deltaArray.contours) 
        tempArea += c.h*c.h;
      if(tempArea > maxContourArea) maxContourArea  = tempArea;
    }

    // for(let i=0;i<c.length;i++) {
    
    for (let deltaArray of meEvent.me_delta_array) {
      let startDate = Date.parse(meEvent.me_delta_array[0].event_time_iso);
      let eventDate = Date.parse(deltaArray.event_time_iso);
      let timeLabel = eventDate-startDate;

      timeLabel = Math.round(timeLabel / 1000);
      labelData.push(timeLabel+"");
      let area = 0;
  
      for (let c of deltaArray.contours) {
        area += c.h*c.h;
      }
      yAreaData.push(100*area/maxContourArea);
      yAreaCount.push(100*deltaArray.contours.length/(maxContourCount*1) );

    }
    let data = {
        // Data to be represented on x-axis
        labels: labelData,
        datasets: [
          {
            label: 'movement area',
            backgroundColor: '#f87979',
            pointBackgroundColor: 'white',
            borderWidth: 5,
            pointBorderColor: '#249EBF',
            // Data to be represented on y-axis
            data: yAreaData,
            pointRadius: 0,
            fill: false,
            borderColor: '#249EBF'

          },
          {
            label: '# areas',
            backgroundColor: '#7e7eff',
            pointBackgroundColor: '000000',
            borderWidth: 5,
            pointBorderColor: '#000000',
            // Data to be represented on y-axis
            data: yAreaCount,
            pointRadius: 0,
            fill: false,
            borderColor: '#7e7eff'
          },
        ]
      };

    return(data);
  }
public getChartOptions(meEVent:MeEvent):any {

      return ({
          scales: {

            yAxes: [{
              ticks: {
                beginAtZero: true
              },
              gridLines: {
                display: false
              }
            }],
            xAxes: [ {
              gridLines: {
                display: false
              }
            }]
          },
          legend: {
            display: false
          },
          responsive: true,
          maintainAspectRatio: false
        }
    );
  }
  
  public getDateFromMeEvent(meEvent:MeEvent):string {
    return(new Utils().getDateFullFromMeEvent(meEvent));
  }

  @Watch('meEvent', { 
    immediate: true, deep: true 
  })
    public meEventChanged(newVal: MeEvent):void {
      console.log(`meEventGroupTextChanged!!v newVal=${newVal.me_name}`);
  }

  public getMovieSrc():string {
    let meEvent = this.meEvent;
    let url = `http://192.168.1.177:9090/catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/${meEvent.me_video_name}`;
    return(url);
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.me_event_detail {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
  background: #ffffff;
  padding:10px;

  border-width:1px;
  border-style:solid;
  border-color:black;
}

.cmo_wrap {
    max-width: 100%;
    max-height: 100%;
}

.cmo_img {
    max-width: 100%;
    max-height: 100%;
}

.cmo_graph {
    max-width: 600px;
    max-height: 100px;
}
</style>

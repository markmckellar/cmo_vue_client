import { MeEvent } from './meevent';
import { MeDelta } from './medelta';

export class MeEventImp implements MeEvent {

  
    public static getNewEmptyMeEvent():MeEventImp {
        let meEvebt = new MeEventImp(
            {
              me_group:"",
              me_event_group:"",
              me_name:"",
              me_tag:"",
              me_image_array:[],
              me_delta_array:[],
              me_time:-1,
              me_video_name:"",
              me_rep_image:"",
              me_json_name:"",
            });
        return(meEvebt);
    }

    public static getNewFromMeEvent(meEvent:MeEvent):MeEventImp {
        let meEVentImpl = new MeEventImp(meEvent);
        return(meEVentImpl);
    }


     public static getDateFullFromMeEvent(meEvent:MeEvent):string {
        let dateString =  this.getDateYear(meEvent)+" "+this.getDateTime(meEvent);
        return(dateString);
      }

      public static getDateTime(meEvent:MeEvent):string { 
        let dateString =  `${meEvent.me_name.substring(9,11)}:${meEvent.me_name.substring(11,13)}.${meEvent.me_name.substring(13,15)}`;
        return(dateString);
      }

      public static getDateYear(meEvent:MeEvent):string {    
        let dateString = `${meEvent.me_name.substring(0,4)}-${meEvent.me_name.substring(4,6)}-${meEvent.me_name.substring(6,8)}`;
        return(dateString);
      }

      public me_group:string;
      public me_event_group:string;
      public me_name:string;
      public me_tag:string;
      public me_image_array:[];
      public me_delta_array:Array<MeDelta>;
      public me_time:number;
      public me_video_name:string;
      public me_rep_image:string;
      public me_json_name:string;
  

      constructor(meEvent:MeEvent) {
        this.me_group = meEvent.me_group;
        this.me_event_group = meEvent.me_event_group;
        this.me_name = meEvent.me_name;
        this.me_tag = meEvent.me_tag;
        this.me_image_array = meEvent.me_image_array;
        this.me_delta_array = meEvent.me_delta_array;
        this.me_time = meEvent.me_time;
        this.me_video_name = meEvent.me_video_name;
        this.me_rep_image = meEvent.me_rep_image;
        this.me_json_name = meEvent.me_json_name;
    }


      public getFirstMeEventTime():string {
        let firstTime = "";
        if(this.me_delta_array.length>0) {
            firstTime = this.me_delta_array[0].event_time_iso;
        }

        return(firstTime);
    }

    public getLastMeEventTime():string {
        let lastTime = "";
        if(this.me_delta_array.length>0) {
            lastTime = this.me_delta_array[this.me_delta_array.length-1].event_time_iso;
        }
    
        return(lastTime);
    }
}
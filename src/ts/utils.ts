import { MeEvent } from './meevent';

export class Utils {

    public getDateFullFromMeEvent(meEvent:MeEvent):string {
        let dateString =  this.getDateYear(meEvent)+" "+this.getDateTime(meEvent);
        return(dateString);
      }

      public getDateTime(meEvent:MeEvent):string { 
        let dateString =  `${meEvent.me_name.substring(9,11)}:${meEvent.me_name.substring(11,13)}.${meEvent.me_name.substring(13,15)}`;
        return(dateString);
      }

      public getDateYear(meEvent:MeEvent):string {    
        let dateString = `${meEvent.me_name.substring(0,4)}-${meEvent.me_name.substring(4,6)}-${meEvent.me_name.substring(6,8)}`;
        return(dateString);
      }
}
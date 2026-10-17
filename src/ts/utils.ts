import { CAMERA_TIME_ZONE } from './catcamservices';
import type { MeEvent } from './meevent';

export class Utils {

    public getDateFullFromMeEvent(meEvent:MeEvent):string {
        let dateString =  this.getDateYear(meEvent)+" "+this.getDateTime(meEvent);
        return(dateString);
      }

      public getDateTime(meEvent:MeEvent):string { 
        let dateString =  `${meEvent.me_name.substring(9,11)}:${meEvent.me_name.substring(11,13)}.${meEvent.me_name.substring(13,15)}`;
        return(dateString+" "+Utils.getZoneName(meEvent));
      }

      // the cameras' zone abbreviation (MST/MDT) in effect when the event happened
      public static getZoneName(meEvent:MeEvent, timeZone:string = CAMERA_TIME_ZONE):string {
        const n = meEvent.me_name;
        const iso = `${n.substring(0,4)}-${n.substring(4,6)}-${n.substring(6,8)}T${n.substring(9,11)}:${n.substring(11,13)}:${n.substring(13,15)}`;
        const t = Utils.parseEventTime(iso, timeZone);
        if(isNaN(t)) {
          return("");
        }
        return(new Intl.DateTimeFormat('en-US', {timeZone, timeZoneName: 'short'})
            .formatToParts(new Date(t)).find(p => p.type === 'timeZoneName')?.value ?? "");
      }

      public getDateYear(meEvent:MeEvent):string {    
        let dateString = `${meEvent.me_name.substring(0,4)}-${meEvent.me_name.substring(4,6)}-${meEvent.me_name.substring(6,8)}`;
        return(dateString);
      }

      // ms since the epoch for an event_time_iso. Times with an offset ("...-06:00") are exact;
      // older ones without one are local time in the cameras' zone, not the browser's.
      public static parseEventTime(iso:string, timeZone:string = CAMERA_TIME_ZONE):number {
        const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?$/.exec(iso);
        if(!m) {
          return(Date.parse(iso));
        }
        const ms = m[7] ? Math.round(parseFloat(m[7])*1000) : 0;
        const asUtc = Date.UTC(+m[1]!, +m[2]!-1, +m[3]!, +m[4]!, +m[5]!, +m[6]!, ms);
        // the zone's offset at that moment, refined once for times near a DST change
        let t = asUtc - Utils.zoneOffsetMs(asUtc, timeZone);
        t = asUtc - Utils.zoneOffsetMs(t, timeZone);
        return(t);
      }

      private static zoneOffsetMs(t:number, timeZone:string):number {
        const parts:Record<string,number> = {};
        for(const p of new Intl.DateTimeFormat('en-US', {timeZone, hourCycle: 'h23',
            year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'})
            .formatToParts(new Date(t))) {
          parts[p.type] = +p.value;
        }
        const wall = Date.UTC(parts.year!, parts.month!-1, parts.day!, parts.hour! % 24, parts.minute!, parts.second!);
        return(wall - (t - t % 1000));
      }
}

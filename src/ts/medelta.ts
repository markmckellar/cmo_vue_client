import { Countour } from './countour';

export interface MeDelta {
    event_time_iso:string;
    occupied:boolean;
    event_time_ms:number;
    event_start_time:number;
    contours:Array<Countour>;

}
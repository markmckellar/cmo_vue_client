import type { MeDelta } from './medelta';



export interface MeEvent {
  me_group:string;
  me_event_group:string;
  me_name:string;
  me_tag:string;
  me_image_array:[];
  me_delta_array:Array<MeDelta>;
  me_time:number;
  me_video_name:string;
  me_rep_image:string;
  me_json_name:string;
  // frames in the movie, when the camera reports it (porch_cam); otherwise count me_delta_array
  me_frame_count?:number;
}
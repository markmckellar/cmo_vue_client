// A camera from /catcam/megroups, with what the viewer can find on it: labels (null: any) and hidden (labels no
// clip they see there has), from their grants, so only the filter buttons they're allowed are offered
export interface MeGroup {
  meGroup:string;
  home?:string;
  homeName?:string;
  labels?:string[]|null;
  hidden?:string[];
}

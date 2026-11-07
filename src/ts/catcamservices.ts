
import type { Movie } from './movie';
import { filtersToQuery, type Filters } from './filters';
import type { MeGroup } from './megroup';
import type { MeEventGroup } from './meeventgroup';
import type { MeEvent } from './meevent';
import type { MeOllama } from './meollama';

// The cmo_server to talk to. A build is served by a cmo_server (at /cmo_client/), so it talks to that same
// server, over http or https as the page was loaded. In dev (npm run dev) it's a cmo_server on this machine
// (one in open mode, e.g. a copy at home, needs no sign-in).
// To use another server, set it when running or building, e.g.
// VITE_CMO_SERVER=http://<home-server>:9090/ npm run dev
export const CMO_SERVER: string = (import.meta.env.VITE_CMO_SERVER
  || (import.meta.env.PROD ? window.location.origin + '/' : 'http://localhost:9090/')).replace(/\/?$/, '/');

// The cameras' time zone. Older events have event_time_iso without an offset, in the camera's
// local time; without this they'd be read in the browser's zone, which is wrong when traveling.
export const CAMERA_TIME_ZONE: string = import.meta.env.VITE_CAMERA_TIME_ZONE || 'America/Denver';

// fetch for the server's API. If the server says we need to sign in (401), or that this account is still
// waiting for approval, go to its sign-in page and come back here afterwards.
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  if (res.status === 401 || res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    if (res.status === 401 || body.error === 'waiting for approval') {
      const here = window.location.pathname + window.location.search + window.location.hash;
      window.location.href = CMO_SERVER + 'signin.html?next=' + encodeURIComponent(here);
    }
  }
  return res;
}

export class CatCamServices {
   public catCamUrl:string;

      constructor(catCamUrl:string) {
        this.catCamUrl = catCamUrl;
    }

  //  https://medium.com/@isachenx/making-a-fetch-request-with-typescript-4a6b523f1e69
  public getMovieList(meGroup:string): Promise<Movie[]> {
    const url = `${this.catCamUrl}catcam/movies/{meGroup}`;
    console.log(`getMovieList:url=${url}`);
    return apiFetch(url)
        .then((res) => res.json());
    }

    public formatMeEvent(meEvent:any):MeEvent {
      const asMeEvent:MeEvent = meEvent;
      return( asMeEvent );
    }

  public formatMovie(movie:any):Movie {
    const asMovie:Movie = movie;
    return( asMovie );
  }

  public formatMeGroup(meGroup:any):MeGroup {
    const asMeGroup:MeGroup = meGroup;
    return( asMeGroup );
  }


  public formatMeEventGroup(meEventGroup:any):MeEventGroup {
    const asMeEventGroup:MeEventGroup = meEventGroup;
    return( asMeEventGroup );
  }
  // @PathVariable int howMayRecords,
  // @PathVariable int startRecord,
  // @PathVariable Double minimumDuration,
  public getMeEventList(
      meGroup:string,
      meGroupEvent:string,
      howMayRecords:number,
      startRecord:number,
      minimumDuration:number): Promise<MeEvent[]> {
    const url = `${this.catCamUrl}catcam/meeventgroup/${meGroup}/${meGroupEvent}?howMayRecords=${howMayRecords}&startRecord=${startRecord}&minimumDuration=${minimumDuration}`;
    console.log(`getMeEventList:url=${url}`);
    if(!meGroup) meGroup = "dummp_arg";
    if(!meGroupEvent) meGroupEvent = "dummp_arg";

    return apiFetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meEvent: any) => this.formatMeEvent(meEvent)));
    }

  // Events that pass the filters (classifications, dates), newest first; no filters lists the newest events.
  // For the next page pass the me_name of the last event received as before.
  public searchMeEvents(
      meGroup:string,
      filters:Filters,
      howMayRecords:number,
      minimumDuration:number,
      before?:string): Promise<MeEvent[]> {
    // brief: without me_delta_array (one entry per frame, up to ~650 KB for a long night clip), with its
    // count and first and last times instead
    let url = `${this.catCamUrl}catcam/search/${meGroup}?howMayRecords=${howMayRecords}&minimumDuration=${minimumDuration}&brief=true`;
    const query = filtersToQuery(filters);
    if(query) url += '&' + query;
    if(before) url += `&before=${encodeURIComponent(before)}`;
    console.log(`searchMeEvents:url=${url}`);

    return apiFetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meEvent: any) => this.formatBriefMeEvent(meEvent)));
    }

  // A brief event as the rest of the app expects it: no deltas, the frame count from me_delta_count
  public formatBriefMeEvent(meEvent:any):MeEvent {
    if(!Array.isArray(meEvent.me_delta_array)) {
      meEvent.me_delta_array = [];
      if(meEvent.me_frame_count === undefined && meEvent.me_delta_count !== undefined) meEvent.me_frame_count = meEvent.me_delta_count;
    }
    return(this.formatMeEvent(meEvent));
  }

  // Ollama's classification of the event (cat, dog, person, ...). null if the event has none.
  public getMeOllama(meEvent:MeEvent): Promise<MeOllama|null> {
    const url = `${this.catCamUrl}catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/me_ollama.json`;

    return apiFetch(url)
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null);
    }

  // Deletes the event and all its files on the server. Rejects if the server refuses.
  public deleteMeEvent(meEvent:MeEvent): Promise<void> {
    const url = `${this.catCamUrl}catcam/event/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}`;
    console.log(`deleteMeEvent:url=${url}`);

    return apiFetch(url, { method: 'DELETE' })
      .then((res) => {
        if(!res.ok) throw new Error(`server said ${res.status}`);
      });
    }

  // Changes the event's classification to labels, e.g. {cat: true, delivery: false}; at least one must
  // be true. The server keeps the old one. Resolves to the new me_ollama.json; rejects if the server refuses.
  public setClassification(meEvent:MeEvent, labels:Record<string, boolean>): Promise<MeOllama> {
    const url = `${this.catCamUrl}catcam/event/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/classification`;
    console.log(`setClassification:url=${url}`);

    return apiFetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(labels) })
      .then((res) => {
        if(!res.ok) throw new Error(`server said ${res.status}`);
        return res.json();
      });
    }

  public getMeEventGroupList(meGroup:string,howMayRecords:number): Promise<MeEventGroup[]> {
    const url = `${this.catCamUrl}catcam/meeventgroup/${meGroup}?howMayRecords=${howMayRecords}`;
    console.log(`getMeEventGroupList:url=${url}`);

    return apiFetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meEventGroup: any) => this.formatMeGroup(meEventGroup)));
    }

  public getMeGroupList(): Promise<MeGroup[]> {
    const url = `${this.catCamUrl}catcam/megroups`;
    console.log(`getMeGroupList:url=${url}`);

    return apiFetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meGroup: any) => this.formatMeGroup(meGroup)));
    }

  public getMovieListX(): Promise<Movie[]> {
    const url = `${this.catCamUrl}catcam/movies`;
    console.log(`getMovieList:url=${url}`);

    return apiFetch(url)
      .then((res) => res.json())
      .then((res) => res.map((movie: any) => this.formatMovie(movie)));
    }

      /*
      class MovieService {
  getMovies(genre: string): Promise<Movie[]> {
    return window.fetch(`https://www.movies.com/${genre}`)
        .then(res => res.json())
        .then(res => res.map((movie: any) => formatMovie(movie))
  }
}*/

}
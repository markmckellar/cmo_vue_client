
import type { Movie } from './movie';
import type { MeGroup } from './megroup';
import type { MeEventGroup } from './meeventgroup';
import type { MeEvent } from './meevent';
import type { MeOllama } from './meollama';


export class CatCamServices {
   public catCamUrl:string;

      constructor(catCamUrl:string) {
        this.catCamUrl = catCamUrl;
    }

  //  https://medium.com/@isachenx/making-a-fetch-request-with-typescript-4a6b523f1e69
  public getMovieList(meGroup:string): Promise<Movie[]> {
    const url = `${this.catCamUrl}catcam/movies/{meGroup}`;
    console.log(`getMovieList:url=${url}`);
    return fetch(url)
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

    return fetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meEvent: any) => this.formatMeEvent(meEvent)));
    }

  // Events on any date that ollama tagged with label (cat, dog, ...), newest first.
  // For the next page pass the me_name of the last event received as before.
  public searchMeEvents(
      meGroup:string,
      label:string,
      howMayRecords:number,
      minimumDuration:number,
      before?:string): Promise<MeEvent[]> {
    let url = `${this.catCamUrl}catcam/search/${meGroup}?label=${encodeURIComponent(label)}&howMayRecords=${howMayRecords}&minimumDuration=${minimumDuration}`;
    if(before) url += `&before=${encodeURIComponent(before)}`;
    console.log(`searchMeEvents:url=${url}`);

    return fetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meEvent: any) => this.formatMeEvent(meEvent)));
    }

  // Ollama's classification of the event (cat, dog, person, ...). null if the event has none.
  public getMeOllama(meEvent:MeEvent): Promise<MeOllama|null> {
    const url = `${this.catCamUrl}catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/me_ollama.json`;

    return fetch(url)
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null);
    }

  public getMeEventGroupList(meGroup:string,howMayRecords:number): Promise<MeEventGroup[]> {
    const url = `${this.catCamUrl}catcam/meeventgroup/${meGroup}?howMayRecords=${howMayRecords}`;
    console.log(`getMeEventGroupList:url=${url}`);

    return fetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meEventGroup: any) => this.formatMeGroup(meEventGroup)));
    }

  public getMeGroupList(): Promise<MeGroup[]> {
    const url = `${this.catCamUrl}catcam/megroups`;
    console.log(`getMeGroupList:url=${url}`);

    return fetch(url)
      .then((res) => res.json())
      .then((res) => res.map((meGroup: any) => this.formatMeGroup(meGroup)));
    }

  public getMovieListX(): Promise<Movie[]> {
    const url = `${this.catCamUrl}catcam/movies`;
    console.log(`getMovieList:url=${url}`);

    return fetch(url)
      .then((res) => res.json())
      .then((res) => res.map((movie: any) => this.formatMovie(movie)));
    }

      /*
      class MovieService {
  getMovies(genre: string): Promise<Movie[]> {
    return fetch(`https://www.movies.com/${genre}`)
        .then(res => res.json())
        .then(res => res.map((movie: any) => formatMovie(movie))
  }
}*/

}
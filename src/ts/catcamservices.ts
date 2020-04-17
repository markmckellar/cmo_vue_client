
import { Movie } from './movie';
import { MeGroup } from './megroup';
import { MeEventGroup } from './meeventgroup';
import { MeEvent } from './meevent';


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
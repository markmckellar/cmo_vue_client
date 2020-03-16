
import { Movie } from './movie';


export class CatCamServices {
   public catCamUrl:string;

      constructor(catCamUrl:string) {
        this.catCamUrl = catCamUrl;
    }

  //  https://medium.com/@isachenx/making-a-fetch-request-with-typescript-4a6b523f1e69
  public getMovieList(): Promise<Movie[]> {
    let url = `${this.catCamUrl}catcam/movies`;
    console.log(`getMovieList:url=${url}`)
    return fetch(url)
        .then(res => res.json())
    }

    public formatMovie(movie:any):Movie {
      let asMovie:Movie = movie;
        return( asMovie );
    }

    public getMovieListX(): Promise<Movie[]> {
      let url = `${this.catCamUrl}catcam/movies`;
      console.log(`getMovieList:url=${url}`);

      return fetch(url)
        .then(res => res.json())
        .then(res => res.map((movie: any) => this.formatMovie(movie)));
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
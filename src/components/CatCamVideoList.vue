<template>
  <div class="movies">
    <h1>Motion events : </h1>
    <ul>
      <li  v-for="(movie, index) in fileList" v-bind:key="index">
        file : {{movie.movieName}} {{movie.movieUrl}} m={{movie.movieUrl}} 
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { CatCamServices } from '../ts/catcamservices';
import { Movie } from '../ts/movie';
/*      <li  v-for="(movie, index) in fileList" v-bind:key="index">file : {{movie.movieName}}</li>
a=<a href="{{movie.movieUrl}}">{{movie.movieName}}</a>
 <a href="{{movie.movieUrl}}">{{movie.movieName}}</a>

 <img dynsrc="{{movie.movieUrl}}" start="fileopen">
          <div>file : {{movie.movieName}} {{movie.movieUrl}}</div>

<video class="tab" controls>Your browser does not support the &lt;video&gt; tag.<source src="{{movie.movieUrl}}"/></video>

<div><video class="tab" controls>Your browser does not support the &lt;video&gt; tag.
            <source src="{{movie.movieUrl}}"/>
          </video></div>

     file : {{movie.movieName}} {{movie.movieUrl}}
        <video class="tab" controls>Your browser does not support the &lt;video&gt; tag.
          <source src="{{movie.movieUrl}}"/>
        </video>

<video class="tab" controls>Your browser does not support the &lt;video&gt; tag.
  <source src="/jargon/m/computer-hope.mp4"/>
</video>
*/
@Component
export default class CatCamVideoList extends Vue {

  public fileList = this.geMovietList();

  public geMovietList(): Array<Movie> {
    
    let self = this;
    new CatCamServices('http://127.0.0.1:9090/').getMovieListX().then(movies => 
      {
        self.fileList = movies;
        console.log("movies="+movies);
       } );
      return(new Array<Movie>());
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


.movies {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
  margin-top: 60px;
}

</style>

<template>
  <div class="cmo_div_outer">

    <Transition name="player">
      <div v-if="isDialogActive()" ref="playerEl" class="player" role="dialog" aria-modal="true">
        <MeEventDetail :meEvent="getCurrentMovie()" @close="closeDialog()" />
      </div>
    </Transition>

    <div class="event_grid">
      <button class="event_card" v-for="(meEvent, index) in fileList" v-bind:key="index" @click="watchMovie(meEvent)">
        <div class="event_thumb">
          <img v-bind:src="getRepImageSrc(meEvent)" alt="" loading="lazy">
          <span class="event_play" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
          </span>
          <div class="event_tags" v-if="getTags(meEvent).length">
            <span v-for="tag in getTags(meEvent)" :key="tag" class="event_tag" :class="`tag_${tag}`">{{tag}}</span>
          </div>
          <span class="event_duration">{{meEvent.me_time.toFixed(1)}}s</span>
        </div>
        <div class="event_body">
          <div class="event_ago">{{getTimePassedToMe(meEvent,index)}} ago</div>
          <div class="event_meta">{{searchLabel ? `${getDateYear(meEvent)} ` : ""}}at {{getDateTime(meEvent)}}</div>
          <div class="event_prev">{{getTime2PreviousMe(meEvent,index)}}</div>
        </div>
      </button>
    </div>

    <div v-if="loading" class="list_status">{{searchLabel ? 'Searching…' : 'Loading…'}}</div>
    <div v-else-if="fileList.length === 0" class="list_status">{{searchLabel ? `No ${searchLabel} events found` : 'No events'}}</div>

    <div class="load_more" v-if="hasMore && !loading && fileList.length > 0">
      <button class="btn" @click="getMore()">Load more</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { CatCamServices } from '../ts/catcamservices';
import type { MeEvent } from '../ts/meevent';
import type { MeOllama } from '../ts/meollama';
import { MeEventImp } from '../ts/meeventimp';
import { Utils } from '../ts/utils';
import MeEventDetail from './MeEventDetail.vue';

const props = withDefaults(defineProps<{
  meGroupText: string;
  meEventGroupText: string;
  searchLabel?: string;
  howMayRecords?: number;
  minimumDuration?: number;
}>(), {
  howMayRecords: 8,
  minimumDuration: 2.0+2.0+2.0, // empty_start+2 seconds_of_video+empty_end
});

const fileList = ref<MeEvent[]>([]);
const startRecord = ref(0);
const loading = ref(false);
const hasMore = ref(true);
const dialogActive = ref(false);
const currentMeEvent = ref<MeEvent>(MeEventImp.getNewEmptyMeEvent());
const playerEl = ref<HTMLElement | null>(null);
const ollamaByName = ref<Record<string, MeOllama|null>>({});

function getTimePassedToMe(meEvent:MeEvent,_index:number):string {
  let me = new MeEventImp(meEvent);
  let dateRecent = new Date(Date.now());
  let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
  let timePassed = dateRecent.getTime()-dateLast.getTime();

  return(msToStringAgo(timePassed));
}

function getTime2PreviousMe(meEvent:MeEvent,index:number):string {
  let me = new MeEventImp(meEvent);
  if(index<(fileList.value.length-1)) {
    let dateRecent = new Date(Date.now());
    let nextMeEvent = new MeEventImp(fileList.value[index+1]!);
    dateRecent.setTime(Date.parse(nextMeEvent.getLastMeEventTime()));
    let dateLast = new Date(Date.parse(me.getLastMeEventTime()));
    let timePassed = dateLast.getTime()-dateRecent.getTime();
    return(`previous event ${msToStringAgo(timePassed)}`);
  } else {
    return("last event");
  }
}

function msToStringAgo(timePassed:number):string {
  let timePassedString = "";
  let seconsPassed = timePassed/1000;
  let minutesPassed = seconsPassed/60;
  let hoursPassed = minutesPassed/60;
  let daysPassed = hoursPassed/24;

  if(seconsPassed<60) timePassedString = `${ Math.round(seconsPassed)} seconds`;
  else if(minutesPassed<10) timePassedString = `${ minutesPassed.toFixed(1)} minutes`;
  else if(minutesPassed<60) timePassedString = `${ minutesPassed.toFixed(0)} minutes`;
  else if(hoursPassed<4) timePassedString = `${ hoursPassed.toFixed(1)} hours`;
  else if(hoursPassed<24) timePassedString = `${ hoursPassed.toFixed(0)} hours`;
  else if(daysPassed<4) timePassedString = `${ daysPassed.toFixed(1)} days`;
  else timePassedString = `${ daysPassed.toFixed(0)} days`;

  return(timePassedString);
}

// Labels to show for an event, from its ollama classification
function getTags(meEvent:MeEvent):string[] {
  let ollama = ollamaByName.value[meEvent.me_name];
  if(!ollama) return([]);

  let tags = Object.keys(ollama).filter((label) => ollama[label] === true);
  // "animal" adds nothing when a specific animal was found, nor "legs" when a person was
  if(tags.some((t) => t !== 'animal' && t !== 'person' && t !== 'legs')) tags = tags.filter((t) => t !== 'animal');
  if(tags.includes('person')) tags = tags.filter((t) => t !== 'legs');
  return(tags);
}

function getDateTime(meEvent:MeEvent):string {
  return(new Utils().getDateTime(meEvent));
}

function getDateYear(meEvent:MeEvent):string {
  return(new Utils().getDateYear(meEvent));
}

function isDialogActive():boolean {
  return(dialogActive.value);
}

function closeDialog():void {
  dialogActive.value = false;
  if(document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

function getCurrentMovie():MeEvent {
  return(currentMeEvent.value);
}

function watchMovie(meEvent:MeEvent) {
  currentMeEvent.value = MeEventImp.getNewFromMeEvent(meEvent);
  dialogActive.value = true;
  // Ask the browser for real fullscreen (hides the phone's address bar). iPhone Safari
  // doesn't support this for page elements, so there the player just fills the window.
  nextTick(() => {
    playerEl.value?.requestFullscreen?.().catch(() => {});
  });
}

// Leaving fullscreen with the browser's own controls (back gesture, Esc) closes the player
function onFullscreenChange():void {
  if(!document.fullscreenElement && dialogActive.value) closeDialog();
}
document.addEventListener('fullscreenchange', onFullscreenChange);

function getRepImageSrc(meEvent:MeEvent):string {
  let url = `http://173.255.215.223:9090/catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/${meEvent.me_rep_image}`;
  return(url);
}

function getMore():void {
  console.log("moooooooooooooooore");
  startRecord.value += props.howMayRecords;
  geMeEventList();
}

function geMeEventList(): void {
  console.log(`geMeEventGroupList meGroup=${props.meGroupText} meGroupEvent=${props.meEventGroupText} searchLabel=${props.searchLabel}`);
  let catCamServices = new CatCamServices('http://173.255.215.223:9090/');
  // a search covers every date, so it pages by the last event received instead of by date
  let request = props.searchLabel
    ? catCamServices.searchMeEvents(
                            props.meGroupText,
                            props.searchLabel,
                            props.howMayRecords,
                            props.minimumDuration,
                            fileList.value[fileList.value.length-1]?.me_name)
    : catCamServices.getMeEventList(
                            props.meGroupText,
                            props.meEventGroupText,
                            props.howMayRecords,
                            startRecord.value,
                            props.minimumDuration);
  loading.value = true;
  request.then((meEventList) => {
      fileList.value.push(...meEventList);
      hasMore.value = meEventList.length >= props.howMayRecords;
      for (let meEvent of meEventList) {
        catCamServices.getMeOllama(meEvent).then((ollama) => {
          ollamaByName.value[meEvent.me_name] = ollama;
        });
      }
     } ).finally(() => {
      loading.value = false;
     } );
}

watch(() => props.meEventGroupText, (newVal: string) => {
  console.log(`meEventGroupText:Changed!!v newVal=${newVal}`);
  geMeEventList();
}, { immediate: true });

function onKeydown(e:KeyboardEvent):void {
  if(e.key === 'Escape') closeDialog();
}

// Close on Esc and stop the page scrolling behind the open video
watch(dialogActive, (active: boolean) => {
  document.body.style.overflow = active ? 'hidden' : '';
  if(active) window.addEventListener('keydown', onKeydown);
  else window.removeEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  document.body.style.overflow = '';
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.event_grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.event_card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  text-align: left;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.event_card:hover {
  transform: translateY(-3px);
  border-color: #3a404d;
  box-shadow: var(--shadow);
}

.event_card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.event_thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--surface-2);
  overflow: hidden;
}

.event_thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s;
}

.event_card:hover .event_thumb img {
  transform: scale(1.04);
}

.event_play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-contrast);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.85);
  transition: opacity 0.2s, transform 0.2s;
}

.event_card:hover .event_play,
.event_card:focus-visible .event_play {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.event_duration {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.event_tags {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  pointer-events: none;
}

.event_tag {
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.tag_cat {
  background: var(--accent);
  color: var(--accent-contrast);
}

.tag_dog {
  background: #4f8df5;
}

.tag_person {
  background: #2fb47c;
}

.tag_raccoon {
  background: #a26bf0;
}

.event_body {
  padding: 12px 14px 14px;
}

.event_ago {
  font-weight: 600;
}

.event_meta {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.event_prev {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.8rem;
}

.list_status {
  padding: 40px 16px;
  color: var(--text-muted);
  text-align: center;
}

.load_more {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.player {
  position: fixed;
  inset: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: #000;
}

.player-enter-active,
.player-leave-active {
  transition: opacity 0.2s;
}

.player-enter-from,
.player-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .event_grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>

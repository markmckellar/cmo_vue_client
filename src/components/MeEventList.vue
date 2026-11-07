<template>
  <div class="cmo_div_outer">

    <Transition name="player">
      <div v-if="isDialogActive()" ref="playerEl" class="player" role="dialog" aria-modal="true">
        <MeEventDetail :meEvent="getCurrentMovie()" :ollama="ollamaByName[getCurrentMovie().me_name]"
          @close="closeDialog()" @deleted="onDeleted" @classified="onClassified" />
      </div>
    </Transition>

    <!-- grouped by day, like a photo app: Today, Yesterday, Wed, Nov 4 -->
    <section v-for="day in days" :key="day.key" class="day">
      <h3 class="day_heading">{{day.heading}}</h3>
      <div class="event_grid">
        <button class="event_card" v-for="item in day.items" :key="item.meEvent.me_name" @click="watchMovie(item.meEvent)"
          :aria-label="`${getTags(item.meEvent).join(', ') || 'Clip'}, ${day.heading} at ${clockTime(item.meEvent.me_name)}`">
          <div class="event_thumb">
            <img v-bind:src="getRepImageSrc(item.meEvent)" alt="" loading="lazy">
            <span class="event_play" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
            </span>
            <div class="event_tags" v-if="getTags(item.meEvent).length">
              <span v-for="tag in getTags(item.meEvent)" :key="tag" class="event_tag" :class="`tag_${tag}`"><LabelIcon :label="tag" :size="13" />{{tag}}</span>
            </div>
            <span class="event_duration">{{formatLength(item.meEvent.me_time)}}</span>
          </div>
          <div class="event_body">
            <div class="event_when"><span class="event_time">{{clockTime(item.meEvent.me_name)}}</span><span class="event_ago">{{getAgo(item.meEvent)}}</span></div>
            <div v-if="getGap(item.index)" class="event_prev">{{getGap(item.index)}}</div>
          </div>
        </button>
      </div>
    </section>

    <div v-if="loading" class="list_status">
      <span class="spinner" aria-hidden="true"></span> {{fileList.length ? 'Loading more…' : 'Looking…'}}
    </div>
    <div v-else-if="fileList.length === 0" class="empty">
      <div class="empty_title">{{hasFilters(filters) ? 'Nothing found' : 'No clips yet'}}</div>
      <div v-if="hasFilters(filters)" class="empty_text">No clips match: {{describe(filters).charAt(0).toLowerCase() + describe(filters).slice(1)}}.</div>
      <div class="empty_actions">
        <button v-if="hasDate(filters)" class="btn btn_primary" @click="emit('clear-date')">Search all dates</button>
        <button v-if="hasFilters(filters)" class="btn" @click="emit('clear-all')">Clear filters</button>
      </div>
    </div>

    <div class="load_more" v-if="hasMore && !loading && fileList.length > 0">
      <button class="btn" @click="getMore()">Load more</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { CatCamServices, CMO_SERVER } from '../ts/catcamservices';
import type { MeEvent } from '../ts/meevent';
import { displayLabels, type MeOllama } from '../ts/meollama';
import { MeEventImp } from '../ts/meeventimp';
import { Utils } from '../ts/utils';
import { describe, hasDate, hasFilters, type Filters } from '../ts/filters';
import { agoText, clockTime, dayHeading, eventDay, gapText } from '../ts/when';
import MeEventDetail from './MeEventDetail.vue';
import LabelIcon from './LabelIcon.vue';

const props = withDefaults(defineProps<{
  meGroupText: string;
  filters: Filters;
  howMayRecords?: number;
  minimumDuration?: number;
}>(), {
  howMayRecords: 8,
  minimumDuration: 2.0+2.0+2.0, // empty_start+2 seconds_of_video+empty_end
});

const emit = defineEmits<{
  'clear-date': [];
  'clear-all': [];
}>();

const fileList = ref<MeEvent[]>([]);
const loading = ref(false);
const hasMore = ref(true);
const dialogActive = ref(false);
const currentMeEvent = ref<MeEvent>(MeEventImp.getNewEmptyMeEvent());
const playerEl = ref<HTMLElement | null>(null);
const ollamaByName = ref<Record<string, MeOllama|null>>({});

// the clips grouped by day, newest first; index is the clip's place in the whole list
const days = computed(() => {
  const out: { key: string; heading: string; items: { meEvent: MeEvent; index: number }[] }[] = [];
  fileList.value.forEach((meEvent, index) => {
    const key = eventDay(meEvent.me_name);
    if (out.length === 0 || out[out.length - 1]!.key !== key) out.push({ key, heading: dayHeading(key), items: [] });
    out[out.length - 1]!.items.push({ meEvent, index });
  });
  return out;
});

function getAgo(meEvent:MeEvent):string {
  return(agoText(Date.now() - Utils.parseEventTime(new MeEventImp(meEvent).getLastMeEventTime())));
}

// "12 days since the one before": only when an animal is picked (how often do raccoons come?), and
// nothing for the last clip in the list
function getGap(index:number):string {
  if(props.filters.labels.length === 0) return("");
  const next = fileList.value[index + 1], cur = fileList.value[index];
  if(!next || !cur) return("");
  const ms = Utils.parseEventTime(new MeEventImp(cur).getLastMeEventTime()) - Utils.parseEventTime(new MeEventImp(next).getLastMeEventTime());
  const one = props.filters.labels.length === 1 && props.filters.match === 'any' ? props.filters.labels[0] : '';
  return(isNaN(ms) ? "" : `${gapText(ms)} since the previous ${one || 'one'}`);
}

// "17s", "1:05"
function formatLength(seconds:number):string {
  const s = Math.round(seconds);
  return(s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
}




// Labels to show for an event, from its ollama classification
function getTags(meEvent:MeEvent):string[] {
  return(displayLabels(ollamaByName.value[meEvent.me_name]));
}

// The classification was changed in the player
function onClassified(meEvent:MeEvent, ollama:MeOllama):void {
  ollamaByName.value[meEvent.me_name] = ollama;
}



function isDialogActive():boolean {
  return(dialogActive.value);
}

function closeDialog():void {
  dialogActive.value = false;
  if(document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

// The event was deleted on the server: back to the list, without it
function onDeleted(meEvent:MeEvent):void {
  closeDialog();
  fileList.value = fileList.value.filter((e) => e.me_name !== meEvent.me_name);
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
  let url = `${CMO_SERVER}catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/${meEvent.me_rep_image}`;
  return(url);
}

function getMore():void {
  geMeEventList();
}

// Pages by the last event received, so a search can cover every date
function geMeEventList(): void {
  let catCamServices = new CatCamServices(CMO_SERVER);
  let request = catCamServices.searchMeEvents(
                            props.meGroupText,
                            props.filters,
                            props.howMayRecords,
                            props.minimumDuration,
                            fileList.value[fileList.value.length-1]?.me_name);
  loading.value = true;
  request.then((meEventList) => {
      fileList.value.push(...meEventList);
      hasMore.value = meEventList.length >= props.howMayRecords;
      for (let meEvent of meEventList) {
        // the server sends each event's labels with the list; an older server doesn't, so ask for them
        const sent = (meEvent as unknown as Record<string, unknown>)['me_ollama'];
        if(sent !== undefined) ollamaByName.value[meEvent.me_name] = sent as MeOllama|null;
        else catCamServices.getMeOllama(meEvent).then((ollama) => {
          ollamaByName.value[meEvent.me_name] = ollama;
        });
      }
     } ).finally(() => {
      loading.value = false;
     } );
}

// the parent gives each set of filters its own list (:key), so this runs once per search
geMeEventList();

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

.event_body {
  padding: 12px 14px 14px;
}

.event_when {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 2px 10px;
}

.event_time {
  font-weight: 600;
  font-size: 1.05rem;
}

.event_ago {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.event_prev {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.day + .day {
  margin-top: 28px;
}

.day_heading {
  margin: 0 0 12px;
  font-size: 1.05rem;
  font-weight: 600;
}

.empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 48px 16px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  text-align: center;
}

.empty_title {
  font-size: 1.15rem;
  font-weight: 600;
}

.empty_text {
  max-width: 34rem;
  color: var(--text-muted);
}

.empty_actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: -3px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
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

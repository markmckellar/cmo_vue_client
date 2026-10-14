<template>
  <div class="me_event_detail">
    <video ref="videoEl" class="detail_video" controls autoplay playsinline :src="getMovieSrc()" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <div class="detail_bar">
      <div class="detail_left">
        <button class="detail_close" @click="emit('close')" aria-label="Close">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <div class="detail_info">
          <div class="detail_date">{{getDateFromMeEvent(meEvent)}}</div>
          <div class="detail_stats">
            <span class="stat">{{meEvent.me_time.toFixed(1)}}s</span>
            <span class="stat">{{frameCount()}} frames</span>
            <span class="stat">{{ (frameCount()/meEvent.me_time).toFixed(0)}} fps</span>
          </div>
        </div>
      </div>
      <!-- top middle; touching it changes the classification. Hidden until the classification has loaded -->
      <div class="detail_tags_row">
        <button v-if="ollama !== undefined" class="detail_tags" @click="askClassify()" aria-label="Change classification" title="Change classification">
          <span v-for="tag in tags" :key="tag" class="event_tag" :class="`tag_${tag}`">{{tag}}</span>
          <span v-if="tags.length === 0" class="event_tag tag_none">unclassified</span>
          <svg class="detail_tags_edit" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
        </button>
      </div>
      <button class="detail_delete" @click="askDelete()" aria-label="Delete event" title="Delete event">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>
      </button>
    </div>

    <!-- In the player, like the delete confirmation, so it shows when the player is fullscreen -->
    <ClassifyDialog v-if="classifying" :meEvent="meEvent" :ollama="ollama ?? null" @close="classifying = false" @saved="onClassified" />

    <!-- In the player rather than window.confirm(), which would drop Chrome out of fullscreen and close the player -->
    <div v-if="confirmingDelete" class="confirm_backdrop" @click.self="cancelDelete()" @keydown.esc.stop="cancelDelete()">
      <div class="confirm_box" role="alertdialog" aria-modal="true" aria-labelledby="confirm_title">
        <div id="confirm_title" class="confirm_title">Delete this event?</div>
        <div class="confirm_text">{{getDateFromMeEvent(meEvent)}} — the video and all its files will be removed from the server. This can't be undone.</div>
        <div v-if="deleteError" class="confirm_error">Couldn't delete: {{deleteError}}</div>
        <div class="confirm_buttons">
          <button ref="cancelEl" class="btn" @click="cancelDelete()" :disabled="deleting">Cancel</button>
          <button class="btn btn_danger" @click="doDelete()" :disabled="deleting">{{deleting ? 'Deleting…' : 'Delete'}}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CatCamServices, CMO_SERVER } from '../ts/catcamservices';
import { computed, nextTick, ref, watch } from 'vue';
import type { MeEvent } from '../ts/meevent';
import { displayLabels, type MeOllama } from '../ts/meollama';
import ClassifyDialog from './ClassifyDialog.vue';
import { Utils } from '../ts/utils';

const props = defineProps<{
  meEvent: MeEvent;
  // the event's classification; null if it has none, undefined while it is still loading
  ollama?: MeOllama|null;
}>();

const emit = defineEmits<{
  close: [];
  deleted: [meEvent: MeEvent];
  classified: [meEvent: MeEvent, ollama: MeOllama];
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const cancelEl = ref<HTMLButtonElement | null>(null);
const confirmingDelete = ref(false);
const deleting = ref(false);
const deleteError = ref("");
const classifying = ref(false);

const tags = computed(() => displayLabels(props.ollama));

function askClassify():void {
  videoEl.value?.pause();
  classifying.value = true;
}

function onClassified(ollama:MeOllama):void {
  classifying.value = false;
  emit('classified', props.meEvent, ollama);
}

function askDelete():void {
  videoEl.value?.pause();
  deleteError.value = "";
  confirmingDelete.value = true;
  // focus Cancel, so Enter doesn't delete and Esc reaches the dialog
  nextTick(() => cancelEl.value?.focus());
}

function cancelDelete():void {
  if(deleting.value) return;
  confirmingDelete.value = false;
}

function doDelete():void {
  deleting.value = true;
  deleteError.value = "";
  new CatCamServices(CMO_SERVER).deleteMeEvent(props.meEvent)
    .then(() => {
      confirmingDelete.value = false;
      emit('deleted', props.meEvent);
    })
    .catch((e: Error) => {
      deleteError.value = e.message;
    })
    .finally(() => {
      deleting.value = false;
    });
}

function getDateFromMeEvent(meEvent:MeEvent):string {
  return(new Utils().getDateFullFromMeEvent(meEvent));
}

watch(() => props.meEvent, (newVal: MeEvent) => {
  console.log(`meEventGroupTextChanged!!v newVal=${newVal.me_name}`);
}, { immediate: true, deep: true });

// pet door events have one me_delta_array entry per frame; porch_cam sends the count instead
function frameCount():number {
  return(props.meEvent.me_frame_count ?? props.meEvent.me_delta_array.length);
}

function getMovieSrc():string {
  let meEvent = props.meEvent;
  let url = `${CMO_SERVER}catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/${meEvent.me_video_name}`;
  return(url);
}
</script>

<style scoped>
.me_event_detail {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

/* The video fills the screen and is scaled to fit, so it works in portrait and landscape */
.detail_video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

/* Floats over the top of the video so it never takes height away from it */
.detail_bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  /* close and date | classification | delete: the middle stays centred on the screen while both sides fit */
  display: grid;
  grid-template-columns: minmax(max-content, 1fr) auto minmax(max-content, 1fr);
  align-items: center;
  gap: 10px 14px;
  padding: 12px 16px 28px;
  padding-top: max(12px, env(safe-area-inset-top));
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
  pointer-events: none;
}

.detail_close {
  flex: none;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #fff;
  pointer-events: auto;
  transition: background 0.15s;
}

.detail_close:hover {
  background: rgba(40, 40, 40, 0.8);
}

.detail_close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.detail_left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.detail_tags_row {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.detail_tags {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  max-width: 100%;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #fff;
  pointer-events: auto;
  transition: background 0.15s;
}

.detail_tags:hover {
  background: rgba(40, 40, 40, 0.8);
}

.detail_tags:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.detail_tags_edit {
  flex: none;
  color: rgba(255, 255, 255, 0.7);
}

.detail_delete {
  flex: none;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  justify-self: end;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #fff;
  pointer-events: auto;
  transition: background 0.15s, color 0.15s;
}

.detail_delete:hover {
  background: rgba(220, 53, 69, 0.85);
}

.detail_delete:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.confirm_backdrop {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
}

.confirm_box {
  width: 100%;
  max-width: 380px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.confirm_title {
  font-size: 1.1rem;
  font-weight: 600;
}

.confirm_text {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.confirm_error {
  margin-top: 10px;
  color: #ff6b6b;
  font-size: 0.9rem;
}

.confirm_buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.confirm_buttons .btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn_danger {
  border-color: #dc3545;
  background: #dc3545;
  color: #fff;
}

.btn_danger:hover:not(:disabled) {
  background: #c82333;
}

/* Dark backdrop so the date and stats stay readable over bright video (porch cam in daylight) */
.detail_info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  min-width: 0;
  padding: 6px 8px 6px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #fff;
}

.detail_date {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.detail_stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stat {
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

/* Narrow screens: the classification gets its own row, centred under the date */
@media (max-width: 700px) {
  .detail_bar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .detail_tags_row {
    grid-row: 2;
    grid-column: 1 / -1;
  }
}

/* Phone held sideways: slimmer bar, drop the stats */
@media (orientation: landscape) and (max-height: 500px) {
  .detail_bar {
    padding-top: max(8px, env(safe-area-inset-top));
    padding-bottom: 20px;
  }

  .detail_close,
  .detail_delete {
    width: 36px;
    height: 36px;
  }

  .detail_stats {
    display: none;
  }
}
</style>

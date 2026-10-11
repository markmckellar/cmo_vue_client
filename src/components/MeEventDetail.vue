<template>
  <div class="me_event_detail">
    <video class="detail_video" controls autoplay playsinline :src="getMovieSrc()" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <div class="detail_bar">
      <button class="detail_close" @click="emit('close')" aria-label="Close">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
      <div class="detail_info">
        <div class="detail_date">{{getDateFromMeEvent(meEvent)}}</div>
        <div class="detail_stats">
          <span class="stat">{{meEvent.me_time.toFixed(1)}}s</span>
          <span class="stat">{{meEvent.me_delta_array.length}} frames</span>
          <span class="stat">{{ (meEvent.me_delta_array.length/meEvent.me_time).toFixed(0)}} fps</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import type { MeEvent } from '../ts/meevent';
import { Utils } from '../ts/utils';

const props = defineProps<{
  meEvent: MeEvent;
}>();

const emit = defineEmits<{
  close: [];
}>();

function getDateFromMeEvent(meEvent:MeEvent):string {
  return(new Utils().getDateFullFromMeEvent(meEvent));
}

watch(() => props.meEvent, (newVal: MeEvent) => {
  console.log(`meEventGroupTextChanged!!v newVal=${newVal.me_name}`);
}, { immediate: true, deep: true });

function getMovieSrc():string {
  let meEvent = props.meEvent;
  let url = `http://173.255.215.223:9090/catcam/data/${meEvent.me_group}/${meEvent.me_event_group}/${meEvent.me_name}/${meEvent.me_video_name}`;
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
  display: flex;
  align-items: center;
  gap: 14px;
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
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  pointer-events: auto;
  transition: background 0.15s;
}

.detail_close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.detail_close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.detail_info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  min-width: 0;
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

/* Phone held sideways: slimmer bar, drop the stats */
@media (orientation: landscape) and (max-height: 500px) {
  .detail_bar {
    padding-top: max(8px, env(safe-area-inset-top));
    padding-bottom: 20px;
  }

  .detail_close {
    width: 36px;
    height: 36px;
  }

  .detail_stats {
    display: none;
  }
}
</style>

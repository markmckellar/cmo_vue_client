<template>
  <!-- One event opened from a link (the cameras' Telegram alerts): index.html#/event/<camera>/<yyyyMMdd>/<event> -->
  <Transition name="player">
    <div v-if="link" class="player" role="dialog" aria-modal="true" @pointerup="goFullscreen">
      <MeEventDetail v-if="meEvent" :meEvent="meEvent" :ollama="ollama"
        @close="close()" @deleted="close()" @classified="onClassified" />
      <div v-else class="linked_status">
        <p>{{ error || 'Loading…' }}</p>
        <button v-if="error" class="btn" @click="close()">Show all events</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { apiFetch, CMO_SERVER } from '../ts/catcamservices';
import type { MeEvent } from '../ts/meevent';
import type { MeOllama } from '../ts/meollama';
import { eventLinkFromHash, type EventLink } from '../ts/eventlink';
import MeEventDetail from './MeEventDetail.vue';

const link = ref<EventLink | null>(null);
const meEvent = ref<MeEvent | null>(null);
const ollama = ref<MeOllama | null | undefined>(undefined);
const error = ref('');

let opening = 0;  // which open() is the latest, so a slow earlier one doesn't overwrite it

async function open(l: EventLink | null): Promise<void> {
  const mine = ++opening;
  link.value = l;
  meEvent.value = null;
  ollama.value = undefined;
  error.value = '';
  if (!l) return;
  try {
    // apiFetch goes to the sign-in page when signed out, and comes back to this same link afterwards
    const res = await apiFetch(`${CMO_SERVER}catcam/event/${l.meGroup}/${l.meEventGroup}/${l.meName}`);
    if (res.status === 404) throw new Error('This event is no longer on the server.');
    if (!res.ok) throw new Error(`The server said ${res.status}.`);
    const event = await res.json();
    const data = event.me_data;
    if (!data || !data.me_video_name) throw new Error('This event has no movie yet.');
    if (mine !== opening) return;  // another link was opened meanwhile
    meEvent.value = {
      ...data,
      me_group: l.meGroup,
      me_event_group: l.meEventGroup,
      me_name: l.meName,
      // the server sends the frame count instead of every frame's delta
      me_delta_array: [],
      me_frame_count: data.me_frame_count ?? data.me_delta_count ?? 0,
    };
    ollama.value = event.me_ollama ?? null;
  } catch (e) {
    if (mine === opening) error.value = (e as Error).message || 'This event could not be loaded.';
  }
}

function onClassified(_e: MeEvent, o: MeOllama): void {
  ollama.value = o;
}

function close(): void {
  // drop the #/event/... so a reload shows the list
  history.replaceState(null, '', window.location.pathname + window.location.search);
  link.value = null;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

// Browsers allow real fullscreen (hides the phone's address bar) only after a tap; iPhone Safari never
// does it for page elements, so there the player just fills the window.
function goFullscreen(e: PointerEvent): void {
  const el = e.currentTarget as HTMLElement | null;
  if ((e.target as HTMLElement | null)?.closest('button')) return;  // not on the way out (Close, Delete)
  if (!document.fullscreenElement && el?.requestFullscreen) el.requestFullscreen().catch(() => {});
}

const onHashChange = () => open(eventLinkFromHash(window.location.hash));
window.addEventListener('hashchange', onHashChange);
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange));
open(eventLinkFromHash(window.location.hash));
</script>

<style scoped>
.player {
  position: fixed;
  inset: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: #000;
}

.linked_status {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 16px;
  height: 100%;
  padding: 24px;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
}

.player-enter-active,
.player-leave-active {
  transition: opacity 0.2s;
}

.player-enter-from,
.player-leave-to {
  opacity: 0;
}
</style>

<template>
  <div class="classify_backdrop" @click.self="close()" @keydown.esc.stop="close()">
    <form class="classify_box" role="dialog" aria-modal="true" aria-labelledby="classify_title" @submit.prevent="save()">
      <div id="classify_title" class="classify_title">Classification</div>
      <div class="classify_when">{{getDateFromMeEvent(meEvent)}}</div>

      <div ref="optionsEl" class="classify_options">
        <label v-for="option in options" :key="option.label" class="classify_option" :class="{ classify_checked: selected.includes(option.label) }">
          <input type="checkbox" :value="option.label" v-model="selected" :disabled="saving">
          <span class="classify_text">
            <span class="classify_label">{{option.label}}</span>
            <span class="classify_description">{{option.description}}</span>
          </span>
        </label>
      </div>

      <div v-if="ollamaSaid !== undefined" class="classify_note">Ollama said: {{ollamaSaid.join(', ') || 'nothing'}}</div>
      <div v-if="selected.length === 0" class="classify_note classify_warn">Pick at least one</div>
      <div v-if="saveError" class="classify_error">Couldn't save: {{saveError}}</div>

      <div class="classify_buttons">
        <button type="button" class="btn" @click="close()" :disabled="saving">Cancel</button>
        <button type="submit" class="btn btn_primary" :disabled="saving || selected.length === 0 || !changed">{{saving ? 'Saving…' : 'Save'}}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { CatCamServices, CMO_SERVER } from '../ts/catcamservices';
import type { MeEvent } from '../ts/meevent';
import { CLASSIFICATIONS, trueLabels, type MeOllama } from '../ts/meollama';
import { Utils } from '../ts/utils';

const props = defineProps<{
  meEvent: MeEvent;
  ollama: MeOllama|null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [ollama: MeOllama];
}>();

// every known classification, plus any other label the event already has
const options = [
  ...CLASSIFICATIONS,
  ...Object.keys(props.ollama ?? {})
    .filter((label) => !label.startsWith('me_') && !CLASSIFICATIONS.some((c) => c.label === label))
    .map((label) => ({ label, description: '' })),
];
const initial = trueLabels(props.ollama);
const selected = ref<string[]>([...initial]);
const saving = ref(false);
const saveError = ref("");
const optionsEl = ref<HTMLElement | null>(null);

const changed = computed(() => selected.value.length !== initial.length || selected.value.some((l) => !initial.includes(l)));

// what ollama said, once someone has changed it; undefined when it hasn't been changed
const ollamaSaid = computed(() => props.ollama && 'me_ollama_original' in props.ollama
  ? trueLabels(props.ollama.me_ollama_original)
  : undefined);

onMounted(() => nextTick(() => optionsEl.value?.querySelector('input')?.focus()));

function close():void {
  if(!saving.value) emit('close');
}

function save():void {
  if(selected.value.length === 0) return;
  let labels: Record<string, boolean> = {};
  for (let option of options) labels[option.label] = selected.value.includes(option.label);

  saving.value = true;
  saveError.value = "";
  new CatCamServices(CMO_SERVER).setClassification(props.meEvent, labels)
    .then((ollama) => emit('saved', ollama))
    .catch((e: Error) => {
      saveError.value = e.message;
    })
    .finally(() => {
      saving.value = false;
    });
}

function getDateFromMeEvent(meEvent:MeEvent):string {
  return(new Utils().getDateFullFromMeEvent(meEvent));
}
</script>

<style scoped>
.classify_backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
}

.classify_box {
  width: 100%;
  max-width: 400px;
  max-height: 100%;
  overflow-y: auto;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.classify_title {
  font-size: 1.1rem;
  font-weight: 600;
}

.classify_when {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.classify_options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
}

.classify_option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  cursor: pointer;
  transition: border-color 0.15s;
}

.classify_checked {
  border-color: var(--accent);
}

.classify_option input {
  flex: none;
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

.classify_text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.classify_label {
  font-weight: 600;
  text-transform: capitalize;
}

.classify_description {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.classify_note {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.classify_warn {
  color: var(--accent);
}

.classify_error {
  margin-top: 10px;
  color: #ff6b6b;
  font-size: 0.9rem;
}

.classify_buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn_primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-contrast);
}

.btn_primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.classify_buttons .btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>

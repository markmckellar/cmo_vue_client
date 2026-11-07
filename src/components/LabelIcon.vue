<template>
  <!-- A simple drawing for a classification (cat, dog, raccoon, person, delivery, animal) or "all", in the
       current text color, so it can sit on a tile, a tag or a button. -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="label_icon">
    <template v-if="label === 'cat'">
      <path d="M5 11V3.8l4.2 3.4h5.6L19 3.8V11a7 7 0 0 1-14 0Z" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M11.2 15h1.6l-.8.9Z" fill="currentColor" />
      <path d="M2.5 13.5 6 14M2.8 16.5 6 15.6M21.5 13.5 18 14M21.2 16.5 18 15.6" stroke-width="1.4" />
    </template>
    <template v-else-if="label === 'dog'">
      <path d="M7.5 6.5h9V15a4.5 4.5 0 0 1-9 0Z" />
      <path d="M7.5 6.5 3.8 8.2l1.1 6.3 2.6-1.8M16.5 6.5l3.7 1.7-1.1 6.3-2.6-1.8" />
      <circle cx="10.2" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="11" r="1" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="15.2" rx="1.5" ry="1.1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="label === 'raccoon'">
      <path d="M6.2 7.4A2.2 2.2 0 1 1 8.6 5M17.8 7.4A2.2 2.2 0 1 0 15.4 5" />
      <path d="M3.8 12.2C3.8 8.2 7.5 5.2 12 5.2s8.2 3 8.2 7c0 2.6-1.9 4.4-4.4 5.4L12 19.6l-3.8-2C5.7 16.6 3.8 14.8 3.8 12.2Z" />
      <path d="M5.2 11.2c1.9-1.7 4.4-1.8 5.9-.3h1.8c1.5-1.5 4-1.4 5.9.3-.4 2.1-1.9 3.2-3.6 3.2-1.3 0-2.3-.8-3.2-1.6-.9.8-1.9 1.6-3.2 1.6-1.7 0-3.2-1.1-3.6-3.2Z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.4" r="1.1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="label === 'person' || label === 'legs'">
      <circle cx="12" cy="7.5" r="3.6" />
      <path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" />
    </template>
    <template v-else-if="label === 'delivery'">
      <path d="M3.5 7.8 12 3.8l8.5 4v8.4L12 20.2l-8.5-4Z" />
      <path d="M3.5 7.8 12 12l8.5-4.2M12 12v8.2M7.8 5.8l8.4 4.1" />
    </template>
    <template v-else-if="label === 'animal'">
      <ellipse cx="12" cy="15.5" rx="4" ry="3.5" />
      <circle cx="6.2" cy="10.5" r="1.8" />
      <circle cx="9.5" cy="6.5" r="1.8" />
      <circle cx="14.5" cy="6.5" r="1.8" />
      <circle cx="17.8" cy="10.5" r="1.8" />
    </template>
    <template v-else>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </template>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  size?: number;
}>(), {
  size: 24,
});
</script>

<style scoped>
.label_icon {
  flex: none;
  display: block;
}
</style>

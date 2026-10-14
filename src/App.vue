<template>
  <header class="app_header">
    <div class="app_header_inner">
      <span class="app_logo" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 8-6 4 6 4V8Z" />
          <rect x="2" y="6" width="14" height="12" rx="2" />
        </svg>
      </span>
      <h1 class="app_title">Home Cams</h1>
    </div>
  </header>

  <main class="app_main">
    <MeGroupList />
  </main>

  <footer class="app_footer">{{ CLIENT_CODE }}<template v-if="serverCode"> · {{ serverCode }}</template></footer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MeGroupList from './components/MeGroupList.vue';
import { CMO_SERVER } from './ts/catcamservices';

// which code this is: the web client's version, and the server's from /catcam/version
// (nothing for a server too old to have it)
const CLIENT_CODE = __CMO_CODE__;
const serverCode = ref('');
onMounted(async () => {
  try {
    const response = await fetch(CMO_SERVER + 'catcam/version');
    if (response.ok) serverCode.value = (await response.json()).code ?? '';
  } catch {
    // the server is unreachable; the event list says so
  }
});
</script>

<style scoped>
.app_header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border);
  background: rgba(14, 16, 20, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.app_header_inner {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 24px;
}

.app_logo {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent);
  color: var(--accent-contrast);
}

.app_title {
  font-size: 1.2rem;
}

.app_main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 28px 24px 64px;
}

.app_footer {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 24px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .app_header_inner,
  .app_main,
  .app_footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>

import { execFileSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// This code's version, from its git tags (see release.bash), the same way in every cmo repo: 1.3.0 on a
// release, 1.3.0+4 four commits after it, 1.3.0+4.dirty (1.3.0+dirty on the release itself) with
// uncommitted changes too. Fixed at build time, so the deployed build says which code made it.
function codeVersion(): string {
  let described = ''
  try {
    described = execFileSync('git', ['describe', '--tags', '--match', 'v[0-9]*', '--long', '--dirty'], {
      cwd: fileURLToPath(new URL('.', import.meta.url)), stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim()
  } catch {
    return 'unknown'
  }
  const m = /^v([0-9.]+)-([0-9]+)-g[0-9a-f]+(-dirty)?$/.exec(described)
  if (!m) return 'unknown'
  const ahead = m[2] !== '0'
  return m[1] + (ahead ? '+' + m[2] : '') + (m[3] ? (ahead ? '.dirty' : '+dirty') : '')
}
const CMO_CODE = 'cmo_vue_client:' + codeVersion()

// https://vite.dev/config/
export default defineConfig({
  // relative asset paths so the build works when cmo_server serves it from /cmo_client/
  base: './',
  plugins: [
    vue(),
    // index.html says which code built it: <meta name="cmo-code" content="cmo_vue_client:1.3.0">
    { name: 'cmo-code', transformIndexHtml: () => [{ tag: 'meta', attrs: { name: 'cmo-code', content: CMO_CODE } }] },
  ],
  define: {
    // e.g. "cmo_vue_client:1.3.0", shown at the bottom of the page
    __CMO_CODE__: JSON.stringify(CMO_CODE),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // same port the old vue-cli dev server used
    port: 8080,
  },
})

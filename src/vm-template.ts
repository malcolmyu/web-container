// Vue + Vite project template that runs inside the NodePod VM.
// After these files are written to the VFS, we run:
//   1. npm install
//   2. npx vite --host 0.0.0.0 --port 3000
export const VM_FILES: Record<string, string> = {
  '/package.json': JSON.stringify({
    name: 'vue-playground',
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite --host 0.0.0.0 --port 3000',
      build: 'vite build',
    },
    dependencies: {
      vue: '^3.5.0',
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.0.0',
      vite: '^6.0.0',
    },
  }, null, 2),

  '/vite.config.js': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
`,

  '/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vue Playground</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`,

  '/src/main.js': `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
`,

  '/src/App.vue': `<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)

function increment() { count.value++ }
function decrement() { count.value-- }
</script>

<template>
  <div class="card">
    <h1>Vue Counter</h1>
    <div class="count">{{ count }}</div>
    <p class="hint">Double: {{ double }}</p>
    <div class="buttons">
      <button @click="decrement">−</button>
      <button @click="increment">+</button>
    </div>
    <p class="footer">Edit <code>src/App.vue</code> — HMR updates instantly</p>
  </div>
</template>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  display: flex; justify-content: center; align-items: center;
  min-height: 100vh; background: #0d1117; color: #e6edf3;
}
.card {
  background: #161b22; border: 1px solid #30363d;
  border-radius: 12px; padding: 48px; text-align: center;
  max-width: 420px; width: 90%;
}
h1 { font-size: 24px; margin-bottom: 24px; color: #58a6ff; }
.count {
  font-size: 64px; font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #58a6ff, #bc8cff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hint { font-size: 16px; margin-bottom: 24px; color: #8b949e; }
.buttons { display: flex; gap: 12px; justify-content: center; }
button {
  padding: 12px 28px; font-size: 20px; font-weight: 600;
  border: 1px solid #30363d; border-radius: 8px;
  background: #21262d; color: #e6edf3; cursor: pointer;
  transition: all 0.15s ease;
}
button:hover { background: #30363d; border-color: #58a6ff; }
.footer { margin-top: 24px; font-size: 13px; color: #8b949e; }
code { background: #21262d; padding: 2px 6px; border-radius: 4px; }
</style>
`,

  '/src/style.css': `body {
  margin: 0;
  padding: 0;
  background: #0d1117;
  color: #e6edf3;
}
`,
}

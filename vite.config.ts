import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import nodepod from '@scelar/nodepod/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [nodepod(), tailwindcss(), vue()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});

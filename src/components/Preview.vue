<script setup lang="ts">
import { Terminal } from 'lucide-vue-next'

defineProps<{
  serverUrl: string | null
  status: string
  statusMessage: string
  consoleVisible: boolean
  previewKey: number
}>()
const emit = defineEmits<{ toggleConsole: [] }>()
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0" style="background:var(--bg-root)">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 h-11 flex-shrink-0" style="background:var(--bg-surface);border-bottom:1px solid var(--border-subtle)">
      <div class="flex items-center gap-2.5 min-w-0">
        <span
          class="w-1.5 h-1.5 rounded-full flex-shrink-0"
          :style="{background: status === 'ready' ? 'var(--green)' : status === 'error' ? 'var(--red)' : 'var(--accent)'}"
        />
        <span class="text-[13px] truncate" style="color:var(--text-secondary)">{{ statusMessage || 'Preview' }}</span>
      </div>
      <button
        class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-all duration-150 flex-shrink-0"
        :style="{
          color: consoleVisible ? 'var(--accent)' : 'var(--text-muted)',
          background: consoleVisible ? 'var(--bg-active)' : 'transparent',
        }"
        @click="emit('toggleConsole')"
        @mouseenter="(e: MouseEvent) => { if(!consoleVisible) (e.target as HTMLElement).style.background='var(--bg-hover)' }"
        @mouseleave="(e: MouseEvent) => { if(!consoleVisible) (e.target as HTMLElement).style.background='transparent' }"
      >
        <Terminal :size="12" />
        <span style="font-size:11px">Console</span>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 bg-white min-h-0 relative">
      <!-- Loading -->
      <div v-if="status !== 'ready' && status !== 'error'" class="h-full flex flex-col items-center justify-center gap-4" style="background:var(--bg-root)">
        <div class="w-6 h-6 rounded-full border-2 animate-spin" style="border-color:var(--border-default);border-top-color:var(--accent)" />
        <p class="text-xs" style="color:var(--text-muted)">{{ statusMessage }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="h-full flex items-center justify-center" style="background:var(--bg-root)">
        <p class="text-sm" style="color:var(--red)">{{ statusMessage }}</p>
      </div>

      <!-- Iframe -->
      <div v-else-if="serverUrl" class="h-full">
        <iframe :key="previewKey" :src="serverUrl" class="w-full h-full border-none" title="preview" sandbox="allow-scripts allow-same-origin allow-forms" />
      </div>
    </div>
  </div>
</template>

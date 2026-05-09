<script setup>
defineProps({
  serverUrl: String,
  status: String, // 'waiting' | 'starting' | 'ready' | 'error'
  statusMessage: String,
})
</script>

<template>
  <div class="preview-panel">
    <!-- Waiting / starting -->
    <div v-if="status === 'waiting' || status === 'starting'" class="preview-empty">
      <div class="loading-spinner" />
      <p>{{ statusMessage || 'Waiting for dev server...' }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="status === 'error'" class="preview-empty">
      <p style="color: #f48771">{{ statusMessage || 'Dev server failed to start' }}</p>
    </div>

    <!-- Ready: show iframe -->
    <div v-else-if="status === 'ready' && serverUrl" class="preview-container">
      <iframe
        :src="serverUrl"
        class="preview-iframe"
        title="preview"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>

    <!-- Fallback -->
    <div v-else class="preview-empty">
      <p>Unable to load preview</p>
    </div>
  </div>
</template>

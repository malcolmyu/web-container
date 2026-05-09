<script setup>
import TreeNode from './TreeNode.vue'

defineProps({
  tree: Array,
  currentFile: String,
})
const emit = defineEmits(['select'])
</script>

<template>
  <div class="file-explorer">
    <TreeNode
      v-for="node in tree"
      :key="node.path"
      :node="node"
      :depth="0"
      :current-file="currentFile"
      @select="(path) => emit('select', path)"
    />
  </div>
</template>

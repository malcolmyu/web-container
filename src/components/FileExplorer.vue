<script setup lang="ts">
import TreeNode from './TreeNode.vue'
import type { FileNode } from './TreeNode.vue'

defineProps<{ tree: FileNode[]; currentFile: string | null }>()
const emit = defineEmits<{ select: [path: string]; delete: [path: string] }>()
</script>

<template>
  <div class="h-full overflow-y-auto py-1.5">
    <TreeNode
      v-for="node in tree"
      :key="node.path"
      :node="node"
      :depth="0"
      :current-file="currentFile"
      @select="(path: string) => emit('select', path)"
      @delete="(path: string) => emit('delete', path)"
    />
  </div>
</template>

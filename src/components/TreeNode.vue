<script setup>
import { ref } from 'vue'

const props = defineProps({
  node: Object,
  depth: Number,
  currentFile: String,
})
const emit = defineEmits(['select'])

const expanded = ref(true)

function getIcon(type) {
  return type === 'dir' ? '\u{1F4C1}' : '\u{1F4C4}'
}

function handleClick() {
  if (props.node.type === 'dir') {
    expanded.value = !expanded.value
  } else {
    emit('select', props.node.path)
  }
}
</script>

<template>
  <div>
    <div
      class="tree-node"
      :class="{ selected: node.path === currentFile }"
      :style="{ paddingLeft: depth * 16 + 8 + 'px' }"
      @click="handleClick"
    >
      <span class="tree-icon">{{ getIcon(node.type) }}</span>
      <span class="tree-name">{{ node.name }}</span>
    </div>
    <TreeNode
      v-if="node.type === 'dir' && expanded && node.children"
      v-for="child in node.children"
      :key="child.path"
      :node="child"
      :depth="depth + 1"
      :current-file="currentFile"
      @select="(path) => emit('select', path)"
    />
  </div>
</template>

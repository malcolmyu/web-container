<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Folder, FolderOpen, File, FileCode, FileJson, FileText,
  FileType, ChevronRight, Image, Globe, FileCog
} from 'lucide-vue-next'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

const props = defineProps<{
  node: FileNode
  depth: number
  currentFile: string | null
}>()
const emit = defineEmits<{ select: [path: string] }>()

const expanded = ref(true)

const icon = computed(() => {
  if (props.node.type === 'dir') return expanded.value ? FolderOpen : Folder
  const n = props.node.name
  if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(n)) return FileCode
  if (/\.json$/.test(n)) return FileJson
  if (/\.(css|scss|less|postcss)$/.test(n)) return FileType
  if (/\.(html|htm)$/.test(n)) return Globe
  if (/\.(md|txt|mdx)$/.test(n)) return FileText
  if (/\.vue$/.test(n)) return FileCode
  if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(n)) return Image
  if (/\.(config\.(js|ts)|\.env|\.gitignore)$/.test(n)) return FileCog
  return File
})

const iconColor = computed(() => {
  if (props.node.type === 'dir') return 'var(--accent)'
  const n = props.node.name
  if (/\.(js|jsx|ts|tsx|mjs|cjs|json)$/.test(n)) return '#e5c07b'
  if (/\.(css|scss|less|postcss)$/.test(n)) return '#7a9ec7'
  if (/\.vue$/.test(n)) return '#7ab87e'
  if (/\.(html|htm)$/.test(n)) return '#d9706a'
  return 'var(--text-muted)'
})

const isSelected = computed(() => props.node.path === props.currentFile)
const leftPad = props.depth * 18 + 12
</script>

<template>
  <div>
    <div
      class="tree-row"
      :class="{ selected: isSelected }"
      :style="{ paddingLeft: leftPad + 'px' }"
      @click="node.type === 'dir' ? (expanded = !expanded) : emit('select', node.path)"
    >
      <!-- Chevron -->
      <span class="chevron-cell" :class="{ invisible: node.type !== 'dir' }">
        <ChevronRight :size="12" class="chevron-icon" :class="{ open: expanded }" />
      </span>

      <!-- Icon -->
      <component :is="icon" :size="15" class="file-icon" :style="{ color: iconColor }" />

      <!-- Name -->
      <span class="file-name">{{ node.name }}</span>
    </div>

    <template v-if="node.type === 'dir' && expanded && node.children">
      <TreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :current-file="currentFile"
        @select="(path) => emit('select', path)"
      />
    </template>
  </div>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding-right: 12px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
  font-size: 12.5px;
  color: var(--text-secondary);
  transition: background 0.1s ease, color 0.1s ease;
  position: relative;
}

.tree-row:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tree-row.selected {
  background: var(--bg-active);
  color: var(--text-primary);
}

.tree-row.selected::after {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 2.5px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
}

/* Chevron */
.chevron-cell {
  width: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chevron-cell.invisible {
  visibility: hidden;
}

.chevron-icon {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.15s ease;
}
.chevron-icon.open {
  transform: rotate(90deg);
}
.tree-row:hover .chevron-icon {
  color: var(--text-secondary);
}

/* File icon */
.file-icon {
  flex-shrink: 0;
  transition: transform 0.15s ease;
}
.tree-row:hover .file-icon {
  transform: scale(1.1);
}

/* Name */
.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

// ── Monaco worker setup for Vite ──
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

self.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  },
}

const props = defineProps<{
  path: string | null
  content: string
}>()
const emit = defineEmits<{ change: [content: string] }>()

const el = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let subscription: monaco.IDisposable | null = null
let suppress = false

onMounted(() => {
  if (!el.value) return
  editor = monaco.editor.create(el.value, {
    value: props.content,
    language: languageFor(props.path),
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
  })
  subscription = editor.onDidChangeModelContent(() => {
    if (suppress) return
    emit('change', editor!.getValue())
  })
})

onUnmounted(() => {
  subscription?.dispose()
  editor?.dispose()
})

watch(() => props.content, (val) => {
  if (!editor) return
  if (editor.getValue() === val) return
  suppress = true
  const model = editor.getModel()
  if (!model) return
  model.setValue(val)
  monaco.editor.setModelLanguage(model, languageFor(props.path))
  suppress = false
})

function languageFor(path: string | null): string {
  if (!path) return 'plaintext'
  if (path.endsWith('.vue')) return 'html'
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript'
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.html')) return 'html'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'markdown'
  return 'plaintext'
}
</script>

<template>
  <div ref="el" class="monaco-container"></div>
</template>

<style scoped>
.monaco-container {
  height: 100%;
  width: 100%;
}
</style>

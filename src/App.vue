<script setup lang="ts">
import { ref, computed } from 'vue'
import { Nodepod } from '@scelar/nodepod'
import type { NodepodProcess } from '@scelar/nodepod'
import AnsiToHtml from 'ansi-to-html'
import { VM_FILES } from './vm-template'
import FileExplorer from './components/FileExplorer.vue'
import CodeEditor from './components/CodeEditor.vue'
import Preview from './components/Preview.vue'
import type { FileNode } from './components/TreeNode.vue'

// ── Output cleanup: handle \r overwrite semantics, collapse spinner dupes ──
const spinnerRe = /^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏✔✖⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ ]/
function cleanOutput(text: string): string {
  let out = text.replace(/\r\n/g, '\n')
  const lines = out.split('\n').map(line => {
    const lastCR = line.lastIndexOf('\r')
    return lastCR >= 0 ? line.substring(lastCR + 1) : line
  })
  const result: string[] = []
  for (const line of lines) {
    if (result.length > 0) {
      const prevBase = result[result.length - 1].replace(spinnerRe, '')
      const currBase = line.replace(spinnerRe, '')
      if (prevBase === currBase && currBase.length > 0) {
        result[result.length - 1] = line
        continue
      }
    }
    result.push(line)
  }
  return result.join('\n')
}

// ── ANSI converter ──
const ansi = new AnsiToHtml({
  fg: '#e8e4e1', bg: '#0d0b0c', newline: true,
  colors: {
    0: '#1a1718', 1: '#d9706a', 2: '#7ab87e', 3: '#d9a85c',
    4: '#7a9ec7', 5: '#b89ac7', 6: '#06b6d4', 7: '#e8e4e1',
    8: '#6b6460', 9: '#f0908c', 10: '#8cc890', 11: '#e5c07b',
    12: '#8db2d8', 13: '#c9aed8', 14: '#22d3ee', 15: '#fafafa',
  },
})

// ── State ──
const pod = ref<Nodepod | null>(null)
const tree = ref<FileNode[]>([])
const currentFile = ref<string | null>(null)
const fileContent = ref('')
const phase = ref<string>('booting')
const statusMessage = ref('')
const serverUrl = ref<string | null>(null)
const installOutput = ref('')
const consoleVisible = ref(true)
const previewKey = ref(0)
const consoleHeight = ref(220)
const isResizing = ref(false)
const rightPanelRef = ref<HTMLElement | null>(null)

const coloredOutput = computed(() => ansi.toHtml(cleanOutput(installOutput.value)))
const showTerminal = computed(() =>
  consoleVisible.value && ['installing', 'starting', 'ready'].includes(phase.value)
)

// ── Console resize (rAF-throttled for smooth drag) ──
let resizeRaf: number | null = null
let pendingClientY = 0
function startResize(e: MouseEvent) {
  isResizing.value = true
  pendingClientY = e.clientY
  document.addEventListener('mousemove', onResize, { passive: true })
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}
function onResize(e: MouseEvent) {
  pendingClientY = e.clientY
  if (!resizeRaf) {
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null
      if (!rightPanelRef.value) return
      const rect = rightPanelRef.value.getBoundingClientRect()
      consoleHeight.value = Math.max(80, Math.min(rect.height * 0.7, rect.bottom - pendingClientY))
    })
  }
}
function stopResize() {
  isResizing.value = false
  if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = null }
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ── Bootstrap ──
async function init() {
  try {
    phase.value = 'booting'
    statusMessage.value = 'Booting runtime...'
    const instance = await Nodepod.boot({
      files: VM_FILES, watermark: false,
      onServerReady: (port: number, url: string) => {
        serverUrl.value = url; phase.value = 'ready'
        statusMessage.value = `Dev server running on port ${port}`
      },
    })
    pod.value = instance
    const fileTree = await buildTree(instance)
    tree.value = fileTree

    phase.value = 'installing'
    statusMessage.value = 'Installing dependencies...'
    const installProc = await instance.spawn('npm', ['install'])
    installProc.on('output', (c: string) => { installOutput.value += c })
    installProc.on('error', (c: string) => { installOutput.value += c })
    if ((await installProc.completion).exitCode !== 0) throw new Error('npm install failed')

    const updatedTree = await buildTree(instance)
    tree.value = updatedTree

    phase.value = 'starting'
    statusMessage.value = 'Starting dev server...'
    const serverTimeout = setTimeout(() => {
      if (phase.value === 'starting') { phase.value = 'error'; statusMessage.value = 'Dev server timed out' }
    }, 30000)
    const viteProc = await instance.spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '3000'])
    viteProc.on('output', (c: string) => { installOutput.value += c })
    viteProc.on('error', (c: string) => { installOutput.value += c })
    viteProc.completion.then(r => {
      clearTimeout(serverTimeout)
      if (phase.value === 'starting' && r.exitCode !== 0) { phase.value = 'error'; statusMessage.value = `Vite exited with code ${r.exitCode}` }
    })

    const findFirstFile = (nodes: FileNode[]): FileNode | null => {
      for (const n of nodes) { if (n.type === 'file') return n; if (n.children) { const f = findFirstFile(n.children); if (f) return f } }
      return null
    }
    const firstFile = findFirstFile(updatedTree)
    if (firstFile) await openFile(instance, firstFile.path)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    phase.value = 'error'; statusMessage.value = msg
    console.error('Boot failed:', err)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildTree(instance: any, dir = '/'): Promise<FileNode[]> {
  const entries = await instance.fs.readdir(dir)
  const result: FileNode[] = []
  for (const name of entries) {
    if (name === 'node_modules') continue
    const fullPath = dir === '/' ? `/${name}` : `${dir}/${name}`
    try {
      const stat = await instance.fs.stat(fullPath)
      if (stat.isDirectory) result.push({ name, path: fullPath, type: 'dir', children: await buildTree(instance, fullPath) })
      else result.push({ name, path: fullPath, type: 'file' })
    } catch { result.push({ name, path: fullPath, type: 'file' }) }
  }
  result.sort((a, b) => a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name))
  return result
}

async function openFile(instance: any, path: string) { currentFile.value = path; fileContent.value = await instance.fs.readFile(path, 'utf8') }
async function handleSelectFile(path: string) { if (pod.value) await openFile(pod.value, path) }
async function handleFileChange(content: string) { if (pod.value && currentFile.value) { await pod.value.fs.writeFile(currentFile.value, content); fileContent.value = content; previewKey.value++ } }
function toggleConsole() { consoleVisible.value = !consoleVisible.value }

init()
</script>

<template>
  <div class="flex h-full" style="background:var(--bg-root);color:var(--text-primary)">
    <!-- ── Sidebar ── -->
    <div class="w-56 min-w-56 flex flex-col" style="background:var(--bg-surface);border-right:1px solid var(--border-subtle)">
      <div class="flex items-center px-5 h-11 flex-shrink-0" style="border-bottom:1px solid var(--border-subtle)">
        <span class="text-[11px] font-semibold tracking-widest select-none" style="color:var(--text-muted)">FILES</span>
      </div>
      <FileExplorer :tree="tree" :current-file="currentFile" @select="handleSelectFile" />
    </div>

    <!-- ── Editor ── -->
    <div class="flex-1 flex flex-col min-w-0" style="background:var(--bg-root)">
      <div v-if="currentFile" class="flex items-center h-11 px-5 flex-shrink-0 gap-2.5" style="background:var(--bg-surface);border-bottom:1px solid var(--border-subtle)">
        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:var(--accent)" />
        <span class="text-[13px] truncate" style="color:var(--text-secondary)">{{ currentFile }}</span>
      </div>
      <CodeEditor v-if="currentFile" :path="currentFile" :content="fileContent" @change="handleFileChange" />
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center space-y-3 animate-fade-in">
          <svg class="w-12 h-12 mx-auto opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          <p style="color:var(--text-muted);font-size:13px">Select a file to edit</p>
        </div>
      </div>
    </div>

    <!-- ── Right panel ── -->
    <div ref="rightPanelRef" class="flex-1 flex flex-col min-w-0 relative" style="border-left:1px solid var(--border-subtle)">
      <Preview :server-url="serverUrl" :status="phase" :status-message="statusMessage" :console-visible="consoleVisible" :preview-key="previewKey" @toggle-console="toggleConsole" />

      <!-- iframe event shield — prevents iframe from stealing mousemove during console resize -->
      <div v-if="isResizing" class="absolute inset-0 z-20" style="cursor:row-resize" />

      <div v-if="showTerminal" class="resize-handle" :class="{active:isResizing}" @mousedown="startResize" />

      <div v-if="showTerminal" class="flex flex-col flex-shrink-0 overflow-hidden" :style="{height:consoleHeight+'px',background:'var(--bg-root)',borderTop:'1px solid var(--border-subtle)'}">
        <div class="flex items-center justify-between px-4 h-9 flex-shrink-0" style="background:var(--bg-surface);border-bottom:1px solid var(--border-subtle)">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full" style="background:var(--accent)" />
            <span class="text-[11px] font-semibold tracking-widest select-none" style="color:var(--text-muted)">CONSOLE</span>
          </div>
          <button class="w-6 h-6 flex items-center justify-center rounded text-sm leading-none transition-colors" style="color:var(--text-muted)" @click="toggleConsole" @mouseenter="(e: MouseEvent) => { (e.target as HTMLElement).style.color = 'var(--text-secondary)'; (e.target as HTMLElement).style.background = 'var(--bg-hover)' }" @mouseleave="(e: MouseEvent) => { (e.target as HTMLElement).style.color = 'var(--text-muted)'; (e.target as HTMLElement).style.background = 'transparent' }">×</button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 whitespace-pre-wrap" style="font-size:12px;line-height:1.6;font-family:'JetBrains Mono','Fira Code',Consolas,monospace" v-html="coloredOutput" />
      </div>
    </div>
  </div>
</template>

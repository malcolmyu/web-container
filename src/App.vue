<script setup>
import { ref, computed } from 'vue'
import { Nodepod } from '@scelar/nodepod'
import { VM_FILES } from './vm-template.js'
import FileExplorer from './components/FileExplorer.vue'
import CodeEditor from './components/CodeEditor.vue'
import Preview from './components/Preview.vue'

// ── State ──
const pod = ref(null)
const tree = ref([])
const currentFile = ref(null)
const fileContent = ref('')
const phase = ref('booting')         // booting | installing | starting | ready | error
const statusMessage = ref('')
const serverUrl = ref(null)
const installOutput = ref('')

// ── Derived ──
const isHtmlFile = (path) => path?.endsWith('.html') || path?.endsWith('.htm')
const showTerminal = computed(() =>
  ['installing', 'starting'].includes(phase.value)
)

// ── Bootstrap ──
async function init() {
  try {
    // 1. Boot Nodepod
    phase.value = 'booting'
    statusMessage.value = 'Booting NodePod runtime...'

    const instance = await Nodepod.boot({
      files: VM_FILES,
      watermark: false,
      onServerReady: (port, url) => {
        serverUrl.value = url
        phase.value = 'ready'
        statusMessage.value = `Dev server running on port ${port}`
      },
    })
    pod.value = instance

    // 2. Build file tree
    const fileTree = await buildTree(instance)
    tree.value = fileTree

    // 3. Run npm install
    phase.value = 'installing'
    statusMessage.value = 'Installing dependencies...'

    const installProc = await instance.spawn('npm', ['install'])
    installProc.on('output', (chunk) => {
      installOutput.value += chunk
    })
    installProc.on('error', (chunk) => {
      installOutput.value += chunk
    })
    const installResult = await installProc.completion
    if (installResult.exitCode !== 0) {
      throw new Error(`npm install failed (exit ${installResult.exitCode})`)
    }

    // 4. Rebuild tree (node_modules may be populated)
    const updatedTree = await buildTree(instance)
    tree.value = updatedTree

    // 5. Start Vite dev server
    phase.value = 'starting'
    statusMessage.value = 'Starting Vite dev server...'

    // Fire-and-forget: onServerReady will set phase to 'ready'.
    // If the server doesn't come up within 30s, show an error.
    const serverTimeout = setTimeout(() => {
      if (phase.value === 'starting') {
        phase.value = 'error'
        statusMessage.value = 'Dev server timed out after 30s'
      }
    }, 30000)

    const viteProc = await instance.spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '3000'])
    viteProc.on('error', (chunk) => {
      installOutput.value += chunk
    })
    viteProc.completion.then((r) => {
      clearTimeout(serverTimeout)
      if (phase.value === 'starting' && r.exitCode !== 0) {
        phase.value = 'error'
        statusMessage.value = `Vite exited with code ${r.exitCode}`
      }
    })

    // 6. Open first file
    const findFirstFile = (nodes) => {
      for (const node of nodes) {
        if (node.type === 'file') return node
        if (node.children) {
          const found = findFirstFile(node.children)
          if (found) return found
        }
      }
      return null
    }
    const firstFile = findFirstFile(updatedTree)
    if (firstFile) {
      await openFile(instance, firstFile.path)
    }
  } catch (err) {
    phase.value = 'error'
    statusMessage.value = err.message || 'Unknown error'
    console.error('Boot failed:', err)
  }
}

// ── File tree ──
async function buildTree(instance, dir = '/') {
  const entries = await instance.fs.readdir(dir)
  const result = []
  for (const name of entries) {
    // skip node_modules — too many entries, hurts perf
    if (name === 'node_modules') continue
    const fullPath = dir === '/' ? `/${name}` : `${dir}/${name}`
    try {
      const stat = await instance.fs.stat(fullPath)
      if (stat.isDirectory) {
        const children = await buildTree(instance, fullPath)
        result.push({ name, path: fullPath, type: 'dir', children })
      } else {
        result.push({ name, path: fullPath, type: 'file' })
      }
    } catch {
      result.push({ name, path: fullPath, type: 'file' })
    }
  }
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return result
}

// ── File operations ──
async function openFile(instance, path) {
  const content = await instance.fs.readFile(path, 'utf8')
  currentFile.value = path
  fileContent.value = content
}

async function handleSelectFile(path) {
  if (!pod.value) return
  await openFile(pod.value, path)
}

async function handleFileChange(content) {
  if (!pod.value || !currentFile.value) return
  await pod.value.fs.writeFile(currentFile.value, content)
  fileContent.value = content
  // Vite HMR handles the preview refresh automatically — no manual update needed
}

// ── Start ──
init()
</script>

<template>
  <div class="app">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">Files</div>
      <FileExplorer
        :tree="tree"
        :current-file="currentFile"
        @select="handleSelectFile"
      />
    </div>

    <!-- Editor -->
    <div class="editor-panel">
      <CodeEditor
        v-if="currentFile"
        :path="currentFile"
        :content="fileContent"
        @change="handleFileChange"
      />
      <div v-else class="editor-empty">Select a file to edit</div>
    </div>

    <!-- Preview / Terminal -->
    <div class="right-panel">
      <Preview
        :server-url="serverUrl"
        :status="phase"
        :status-message="statusMessage"
      />

      <!-- Install progress overlay -->
      <div v-if="showTerminal" class="terminal-overlay">
        <div class="terminal-header">Console</div>
        <pre class="terminal-output">{{ installOutput }}</pre>
      </div>
    </div>
  </div>
</template>

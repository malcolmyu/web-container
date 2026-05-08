import { useState, useEffect, useCallback } from 'react';
import { Nodepod } from '@scelar/nodepod';
import { DEMO_FILES } from './demo-files';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import Preview from './components/Preview';

export default function App() {
  const [pod, setPod] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [tree, setTree] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState(null);

  const buildTree = useCallback(async (instance, dir = '/') => {
    const entries = await instance.fs.readdir(dir);
    const result = [];
    for (const name of entries) {
      const fullPath = dir === '/' ? `/${name}` : `${dir}/${name}`;
      try {
        const stat = await instance.fs.stat(fullPath);
        if (stat.isDirectory()) {
          const children = await buildTree(instance, fullPath);
          result.push({ name, path: fullPath, type: 'dir', children });
        } else {
          result.push({ name, path: fullPath, type: 'file' });
        }
      } catch {
        // stat failed, treat as file
        result.push({ name, path: fullPath, type: 'file' });
      }
    }
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const instance = await Nodepod.boot({
          files: DEMO_FILES,
          watermark: false,
          onServerReady: (_port, url) => {
            if (!cancelled) setPreviewUrl(url);
          },
        });
        if (cancelled) return;
        setPod(instance);

        const fileTree = await buildTree(instance);
        if (cancelled) return;
        setTree(fileTree);

        // Open the first file by default
        const findFirstFile = (nodes) => {
          for (const node of nodes) {
            if (node.type === 'file') return node;
            if (node.children) {
              const found = findFirstFile(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        const firstFile = findFirstFile(fileTree);
        if (firstFile) {
          const content = await instance.fs.readFile(firstFile.path);
          if (!cancelled) {
            setCurrentFile(firstFile.path);
            setFileContent(content);
          }
        }

        // Install deps and start Vite
        await instance.install(['react', 'react-dom', '@vitejs/plugin-react']);
        if (!cancelled) {
          instance.spawn('npx', ['vite', '--port', '5173']);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setBootError(err.message);
          setLoading(false);
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [buildTree]);

  const handleSelectFile = useCallback(async (path) => {
    if (!pod) return;
    const content = await pod.fs.readFile(path);
    setCurrentFile(path);
    setFileContent(content);
  }, [pod]);

  const handleFileChange = useCallback(async (content) => {
    if (!pod || !currentFile) return;
    await pod.fs.writeFile(currentFile, content);
    setFileContent(content);
  }, [pod, currentFile]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <p>Booting Nodepod runtime...</p>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="loading-overlay">
        <p style={{ color: '#f48771' }}>Error: {bootError}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">Files</div>
        <FileExplorer tree={tree} currentFile={currentFile} onSelect={handleSelectFile} />
      </div>
      <div className="editor-panel">
        {currentFile ? (
          <Editor
            path={currentFile}
            content={fileContent}
            onChange={handleFileChange}
          />
        ) : (
          <div className="editor-empty">Select a file to edit</div>
        )}
      </div>
      <div className="preview-panel">
        <Preview url={previewUrl} />
      </div>
    </div>
  );
}

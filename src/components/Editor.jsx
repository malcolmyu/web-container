import Editor from '@monaco-editor/react';

const extToLang = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  css: 'css',
  html: 'html',
  json: 'json',
  md: 'markdown',
};

function getLanguage(path) {
  if (!path) return 'plaintext';
  const ext = path.split('.').pop();
  return extToLang[ext] || 'plaintext';
}

export default function CodeEditor({ path, content, onChange }) {
  return (
    <Editor
      height="100%"
      language={getLanguage(path)}
      value={content}
      onChange={(val) => onChange(val || '')}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
      }}
    />
  );
}

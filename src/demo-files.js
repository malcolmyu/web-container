export const DEMO_FILES = {
  '/package.json': JSON.stringify({
    name: 'demo-app',
    scripts: { dev: 'vite' },
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: { '@vitejs/plugin-react': '^4.0.0', vite: '^6.0.0' },
  }),
  '/index.html':
    '<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>',
  '/vite.config.js':
    'import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({ plugins: [react()] });',
  '/src/main.jsx':
    'import React, { useState } from "react"; import { createRoot } from "react-dom/client"; function App() { const [count, setCount] = useState(0); return /*#__PURE__*/ React.createElement("div", { style: { padding: "40px", fontFamily: "system-ui", textAlign: "center" } }, /*#__PURE__*/ React.createElement("h1", null, "Vite + React"), /*#__PURE__*/ React.createElement("div", { style: { fontSize: "48px", margin: "20px 0" } }, count), /*#__PURE__*/ React.createElement("button", { onClick: () => setCount(c => c + 1), style: { padding: "12px 24px", fontSize: "18px", cursor: "pointer" } }, "+"), /*#__PURE__*/ React.createElement("button", { onClick: () => setCount(c => c - 1), style: { padding: "12px 24px", fontSize: "18px", cursor: "pointer", marginLeft: "12px" } }, "-")); } createRoot(document.getElementById("root")).render(/*#__PURE__*/ React.createElement(App, null));',
};

import { useState } from 'react';

function getIcon(type) {
  return type === 'dir' ? '📁' : '📄';
}

function TreeNode({ node, depth, currentFile, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const isDir = node.type === 'dir';
  const isSelected = node.path === currentFile;

  return (
    <div>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => {
          if (isDir) {
            setExpanded(!expanded);
          } else {
            onSelect(node.path);
          }
        }}
      >
        <span className="tree-icon">{getIcon(node.type)}</span>
        <span className="tree-name">{node.name}</span>
      </div>
      {isDir && expanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          currentFile={currentFile}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function FileExplorer({ tree, currentFile, onSelect }) {
  return (
    <div className="file-explorer">
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          currentFile={currentFile}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

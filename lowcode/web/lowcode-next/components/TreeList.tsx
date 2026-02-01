import type { LowCodeNodeMap } from "../lib/schema";

interface TreeListProps {
  nodes: LowCodeNodeMap;
  rootId: string;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TreeList({ nodes, rootId, selectedId, onSelect }: TreeListProps) {
  return (
    <div className="tree-list">
      <TreeItem
        nodeId={rootId}
        nodes={nodes}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

interface TreeItemProps {
  nodeId: string;
  nodes: LowCodeNodeMap;
  selectedId: string;
  onSelect: (id: string) => void;
  depth?: number;
}

function TreeItem({ nodeId, nodes, selectedId, onSelect, depth = 0 }: TreeItemProps) {
  const node = nodes[nodeId];
  if (!node) {
    return null;
  }

  return (
    <div>
      <button
        className={
          selectedId === node.id ? "tree-item tree-item-active" : "tree-item"
        }
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        type="button"
        onClick={() => onSelect(node.id)}
      >
        <span className="tree-item-type">{node.type}</span>
        <span>{node.label}</span>
      </button>
      {node.children?.length ? (
        <div>
          {node.children.map((childId) => (
            <TreeItem
              key={childId}
              nodeId={childId}
              nodes={nodes}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

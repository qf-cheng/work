import type { LayoutNode } from "../lib/schema";

interface TreeListProps {
  layout: LayoutNode;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TreeList({ layout, selectedId, onSelect }: TreeListProps) {
  return (
    <div className="tree-list">
      <TreeItem node={layout} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}

interface TreeItemProps {
  node: LayoutNode;
  selectedId: string;
  onSelect: (id: string) => void;
  depth?: number;
}

function TreeItem({ node, selectedId, onSelect, depth = 0 }: TreeItemProps) {
  return (
    <div>
      <button
        className={selectedId === node.id ? "tree-item tree-item-active" : "tree-item"}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        type="button"
        onClick={() => onSelect(node.id)}
      >
        <span className="tree-item-type">{node.type}</span>
        <span>{node.label ?? node.text ?? node.id}</span>
      </button>
      {node.children?.length ? (
        <div>
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

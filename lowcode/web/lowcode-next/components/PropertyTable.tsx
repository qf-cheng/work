import type { LowCodeNode } from "../lib/schema";

interface PropertyTableProps {
  node?: LowCodeNode;
}

export function PropertyTable({ node }: PropertyTableProps) {
  if (!node) {
    return <p className="empty">未选中节点。</p>;
  }

  return (
    <div className="property-table">
      <div>
        <p className="property-label">节点名称</p>
        <p className="property-value">{node.label}</p>
      </div>
      <div>
        <p className="property-label">节点类型</p>
        <p className="property-value">{node.type}</p>
      </div>
      {Object.entries(node.props).map(([key, value]) => (
        <div key={key}>
          <p className="property-label">{key}</p>
          <p className="property-value">{String(value)}</p>
        </div>
      ))}
    </div>
  );
}

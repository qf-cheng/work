import type { LayoutNode } from "../lib/schema";

interface PropertyTableProps {
  node?: LayoutNode;
}

export function PropertyTable({ node }: PropertyTableProps) {
  if (!node) {
    return <p className="empty">未选中节点。</p>;
  }

  return (
    <div className="property-table">
      <div>
        <p className="property-label">节点 ID</p>
        <p className="property-value">{node.id}</p>
      </div>
      <div>
        <p className="property-label">节点类型</p>
        <p className="property-value">{node.type}</p>
      </div>
      {node.label ? (
        <div>
          <p className="property-label">标题</p>
          <p className="property-value">{node.label}</p>
        </div>
      ) : null}
      {node.bind ? (
        <div>
          <p className="property-label">绑定路径</p>
          <p className="property-value">{node.bind}</p>
        </div>
      ) : null}
      {node.bindVisible ? (
        <div>
          <p className="property-label">显示绑定</p>
          <p className="property-value">{node.bindVisible}</p>
        </div>
      ) : null}
      {node.on ? (
        <div>
          <p className="property-label">事件</p>
          <p className="property-value">{Object.entries(node.on).map(([k, v]) => `${k}: ${v}`).join(" | ")}</p>
        </div>
      ) : null}
      {node.props ? (
        <div>
          <p className="property-label">Props</p>
          <pre className="property-code">{JSON.stringify(node.props, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

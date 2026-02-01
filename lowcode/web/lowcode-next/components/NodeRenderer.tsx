import { registry } from "../lib/registry";
import type { LayoutNode, RuntimeRoot } from "../lib/schema";

interface NodeRendererProps {
  node: LayoutNode;
  runtime: RuntimeRoot;
  onAction: (actionId: string, ctx?: Record<string, unknown>) => void;
}

export function NodeRenderer({ node, runtime, onAction }: NodeRendererProps) {
  const Component = registry[node.type];
  if (!Component) {
    return <div className="node-fallback">未注册组件：{node.type}</div>;
  }

  return (
    <div className="node">
      <Component node={node} runtime={runtime} onAction={onAction}>
        {node.children?.map((child) => (
          <NodeRenderer key={child.id} node={child} runtime={runtime} onAction={onAction} />
        ))}
      </Component>
    </div>
  );
}

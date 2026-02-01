import { registry } from "../lib/registry";
import type { LowCodeNodeMap } from "../lib/schema";

interface NodeRendererProps {
  nodeId: string;
  nodes: LowCodeNodeMap;
  selectedId: string;
}

export function NodeRenderer({ nodeId, nodes, selectedId }: NodeRendererProps) {
  const node = nodes[nodeId];
  if (!node) {
    return null;
  }

  const Component = registry[node.type];
  if (!Component) {
    return (
      <div className="node-fallback">
        未注册组件：{node.type}
      </div>
    );
  }

  const isSelected = node.id === selectedId;

  return (
    <div className={isSelected ? "node node-selected" : "node"}>
      <Component node={node}>
        {node.children?.length
          ? node.children.map((childId) => (
              <NodeRenderer
                key={childId}
                nodeId={childId}
                nodes={nodes}
                selectedId={selectedId}
              />
            ))
          : null}
      </Component>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "../components/Canvas";
import { Panel } from "../components/Panel";
import { PropertyTable } from "../components/PropertyTable";
import { TreeList } from "../components/TreeList";
import { initialPageSchema, type LayoutNode } from "../lib/schema";
import { createRuntime } from "../lib/runtime";
import { resourceClient } from "../lib/resourceClient";

function findNode(root: LayoutNode, id: string): LayoutNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return undefined;
}

export default function HomePage() {
  const [selectedId, setSelectedId] = useState(initialPageSchema.layout.id);
  const [version, setVersion] = useState(0);

  const runtime = useMemo(
    () =>
      createRuntime(initialPageSchema, {
        resourceAdapter: resourceClient,
        onChange: () => setVersion((value) => value + 1),
      }),
    []
  );

  useEffect(() => {
    if (initialPageSchema.onLoadAction) {
      runtime.runAction(initialPageSchema.onLoadAction).catch(console.error);
    }
  }, [runtime]);

  const selectedNode = findNode(initialPageSchema.layout, selectedId);

  return (
    <main className="app-grid" data-version={version}>
      <Panel title="组件树" description="结构化 schema 驱动的节点树。">
        <TreeList layout={initialPageSchema.layout} selectedId={selectedId} onSelect={setSelectedId} />
      </Panel>
      <Panel title="画布预览" description="动作 DSL + runtime + 渲染器联动。">
        <Canvas
          layout={initialPageSchema.layout}
          runtime={runtime.root}
          onAction={(actionId, ctx) => runtime.runAction(actionId, ctx)}
        />
      </Panel>
      <Panel title="属性面板" description="查看节点元信息与绑定关系。">
        <PropertyTable node={selectedNode} />
      </Panel>
    </main>
  );
}

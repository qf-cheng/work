"use client";

import { useMemo, useState } from "react";
import { Canvas } from "../components/Canvas";
import { Panel } from "../components/Panel";
import { PropertyTable } from "../components/PropertyTable";
import { TreeList } from "../components/TreeList";
import { findNodeById, initialSchema } from "../lib/schema";

export default function HomePage() {
  const [selectedId, setSelectedId] = useState(initialSchema.rootId);
  const selectedNode = useMemo(
    () => findNodeById(initialSchema, selectedId),
    [selectedId]
  );

  return (
    <main className="app-grid">
      <Panel title="组件树" description="结构化 schema 驱动的节点树。">
        <TreeList
          nodes={initialSchema.nodes}
          rootId={initialSchema.rootId}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </Panel>
      <Panel title="画布预览" description="组件注册表 + 递归渲染器。">
        <Canvas schema={initialSchema} selectedId={selectedId} />
      </Panel>
      <Panel title="属性面板" description="基于节点类型展示属性信息。">
        <PropertyTable node={selectedNode} />
      </Panel>
    </main>
  );
}

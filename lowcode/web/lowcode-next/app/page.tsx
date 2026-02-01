"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "../components/Canvas";
import { EditorPanel } from "../components/EditorPanel";
import { Panel } from "../components/Panel";
import { TreeList } from "../components/TreeList";
import { initialPageSchema, type LayoutNode, type PageSchema } from "../lib/schema";
import { createRuntime } from "../lib/runtime";
import { resourceClient } from "../lib/resourceClient";
import { addChild, findNode, removeNode, updateNode } from "../lib/editor";

function createNewNode(type: LayoutNode["type"]): LayoutNode {
  return {
    id: `${type.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    label: type,
    children: type === "Container" || type === "Form" || type === "FormItem" ? [] : undefined,
  };
}

export default function HomePage() {
  const [schema, setSchema] = useState<PageSchema>(initialPageSchema);
  const [selectedId, setSelectedId] = useState(schema.layout.id);
  const [version, setVersion] = useState(0);

  const runtime = useMemo(
    () =>
      createRuntime(schema, {
        resourceAdapter: resourceClient,
        onChange: () => setVersion((value) => value + 1),
      }),
    [schema]
  );

  useEffect(() => {
    if (schema.onLoadAction) {
      runtime.runAction(schema.onLoadAction).catch(console.error);
    }
  }, [runtime, schema]);

  const selectedNode = findNode(schema.layout, selectedId);

  return (
    <main className="app-grid" data-version={version}>
      <Panel title="组件树" description="结构化 schema 驱动的节点树。">
        <TreeList layout={schema.layout} selectedId={selectedId} onSelect={setSelectedId} />
      </Panel>
      <Panel title="画布预览" description="动作 DSL + runtime + 渲染器联动。">
        <Canvas
          layout={schema.layout}
          runtime={runtime.root}
          onAction={(actionId, ctx) => runtime.runAction(actionId, ctx)}
        />
      </Panel>
      <Panel title="页面编辑" description="编辑节点结构、绑定和属性。">
        <EditorPanel
          node={selectedNode}
          onUpdate={(patch) =>
            setSchema((prev) => ({
              ...prev,
              layout: updateNode(prev.layout, selectedId, patch),
            }))
          }
          onAddChild={(type) =>
            setSchema((prev) => ({
              ...prev,
              layout: addChild(prev.layout, selectedId, createNewNode(type)),
            }))
          }
          onRemove={() => {
            if (selectedId === schema.layout.id) return;
            setSchema((prev) => ({
              ...prev,
              layout: removeNode(prev.layout, selectedId),
            }));
            setSelectedId(schema.layout.id);
          }}
        />
      </Panel>
    </main>
  );
}

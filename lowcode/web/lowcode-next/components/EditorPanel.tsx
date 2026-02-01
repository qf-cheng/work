import { useMemo, useState } from "react";
import type { LayoutNode } from "../lib/schema";
import { PropertyTable } from "./PropertyTable";

interface EditorPanelProps {
  node?: LayoutNode;
  onUpdate: (patch: Partial<LayoutNode>) => void;
  onAddChild: (type: LayoutNode["type"]) => void;
  onRemove: () => void;
}

const childTypes: Array<LayoutNode["type"]> = [
  "Container",
  "Text",
  "Button",
  "Input",
  "Select",
  "Table",
  "Pagination",
  "Dialog",
  "Form",
  "FormItem",
];

export function EditorPanel({ node, onUpdate, onAddChild, onRemove }: EditorPanelProps) {
  const [childType, setChildType] = useState<LayoutNode["type"]>("Container");
  const isContainer = useMemo(() => Boolean(node?.children), [node]);

  if (!node) {
    return <p className="empty">请选择需要编辑的节点。</p>;
  }

  return (
    <div className="editor-panel">
      <section className="editor-block">
        <h3>基础信息</h3>
        <label className="editor-field">
          <span>节点类型</span>
          <input readOnly value={node.type} />
        </label>
        <label className="editor-field">
          <span>标题</span>
          <input
            value={node.label ?? ""}
            placeholder="请输入标题"
            onChange={(event) => onUpdate({ label: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>文本</span>
          <input
            value={node.text ?? ""}
            placeholder="文本内容"
            onChange={(event) => onUpdate({ text: event.target.value })}
          />
        </label>
      </section>

      <section className="editor-block">
        <h3>数据绑定</h3>
        <label className="editor-field">
          <span>bind</span>
          <input
            value={node.bind ?? ""}
            placeholder="$data.xxx"
            onChange={(event) => onUpdate({ bind: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>bindVisible</span>
          <input
            value={node.bindVisible ?? ""}
            placeholder="$ui.xxx"
            onChange={(event) => onUpdate({ bindVisible: event.target.value })}
          />
        </label>
      </section>

      <section className="editor-block">
        <h3>结构操作</h3>
        <div className="editor-actions">
          <select value={childType} onChange={(event) => setChildType(event.target.value as LayoutNode["type"])}>
            {childTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => onAddChild(childType)} disabled={!isContainer}>
            添加子节点
          </button>
          <button type="button" className="danger" onClick={onRemove}>
            删除节点
          </button>
        </div>
        {!isContainer ? <p className="editor-hint">当前节点没有 children 属性，无法添加子节点。</p> : null}
      </section>

      <section className="editor-block">
        <h3>节点预览</h3>
        <PropertyTable node={node} />
      </section>
    </div>
  );
}

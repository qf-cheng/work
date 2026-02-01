import type { ReactNode } from "react";
import { getByPath } from "./runtime";
import type { LayoutNode, RuntimeRoot } from "./schema";

export interface RendererProps {
  node: LayoutNode;
  runtime: RuntimeRoot;
  onAction: (actionId: string, ctx?: Record<string, unknown>) => void;
  children?: ReactNode;
}

type Renderer = (props: RendererProps) => JSX.Element;

const Container: Renderer = ({ node, children }) => {
  const layout = String(node.props?.layout ?? "stack");
  const gap = Number(node.props?.gap ?? 12);
  const justify = String(node.props?.justify ?? "flex-start");
  const className = layout === "row" ? "container-row" : "container-stack";
  return (
    <div className={className} style={{ gap, justifyContent: justify }}>
      {children}
    </div>
  );
};

const Text: Renderer = ({ node }) => (
  <p className="text-body">{node.text ?? node.label}</p>
);

const Button: Renderer = ({ node, onAction }) => (
  <button className="button" type="button" onClick={() => node.on?.click && onAction(node.on.click)}>
    {node.text ?? node.label ?? "按钮"}
  </button>
);

const Input: Renderer = ({ node, runtime }) => {
  const value = node.bind ? getByPath(runtime, node.bind) : "";
  return (
    <label className="field">
      {node.label ? <span>{node.label}</span> : null}
      <input placeholder={String(node.props?.placeholder ?? "")} readOnly value={String(value ?? "")} />
    </label>
  );
};

const Select: Renderer = ({ node, runtime }) => {
  const value = node.bind ? getByPath(runtime, node.bind) : "";
  return (
    <label className="field">
      {node.label ? <span>{node.label}</span> : null}
      <select disabled value={String(value ?? "")}>
        {(node.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

const Table: Renderer = ({ node, runtime, onAction }) => {
  const data = node.bind ? (getByPath(runtime, node.bind) as { docs?: Array<Record<string, unknown>> }) : null;
  const docs = data?.docs ?? [];
  const columns = (node.props?.columns ?? []) as Array<{ prop: string; label: string }>;
  return (
    <div className="table">
      <div className="table-header">{node.label ?? "数据表"}</div>
      <div className="table-grid" style={{ gridTemplateColumns: `repeat(${columns.length + 1}, 1fr)` }}>
        {columns.map((column) => (
          <div key={column.prop} className="table-cell table-cell-head">
            {column.label}
          </div>
        ))}
        <div className="table-cell table-cell-head">操作</div>
        {docs.map((row, index) => (
          <div key={row._id ?? index} className="table-row">
            {columns.map((column) => (
              <div key={`${row._id ?? index}-${column.prop}`} className="table-cell">
                {String(row[column.prop] ?? "")}
              </div>
            ))}
            <div className="table-cell">
              <div className="table-actions">
                {(node.rowActions ?? []).map((action) => (
                  <button
                    key={action.label}
                    className={action.type === "danger" ? "link-danger" : "link"}
                    type="button"
                    onClick={() => onAction(action.action, { row })}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Pagination: Renderer = ({ node, runtime, onAction }) => {
  const pagination = node.bindPagination ? (getByPath(runtime, node.bindPagination) as { pageNo?: number; pageSize?: number; total?: number }) : {};
  return (
    <div className="pagination">
      <span>第 {pagination?.pageNo ?? 1} 页</span>
      <span>共 {pagination?.total ?? 0} 条</span>
      <button type="button" onClick={() => node.on?.change && onAction(node.on.change)}>
        刷新
      </button>
    </div>
  );
};

const Dialog: Renderer = ({ node, runtime, onAction, children }) => {
  const visible = node.bindVisible ? Boolean(getByPath(runtime, node.bindVisible)) : false;
  if (!visible) return <div className="dialog-hidden">{node.label}</div>;
  return (
    <div className="dialog">
      <div className="dialog-header">
        <strong>{node.label ?? "弹窗"}</strong>
      </div>
      <div className="dialog-body">{children}</div>
      <div className="dialog-footer">
        <button type="button" onClick={() => node.on?.ok && onAction(node.on.ok)}>
          保存
        </button>
      </div>
    </div>
  );
};

const Form: Renderer = ({ children }) => <div className="form">{children}</div>;

const FormItem: Renderer = ({ node, children }) => (
  <div className="form-item">
    <span className="form-label">{node.label}</span>
    {children}
  </div>
);

export const registry: Record<LayoutNode["type"], Renderer> = {
  Container,
  Text,
  Button,
  Input,
  Select,
  Table,
  Pagination,
  Dialog,
  Form,
  FormItem,
};

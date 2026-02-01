import type { ReactNode } from "react";
import type { LowCodeNode, NodeType } from "./schema";

interface RendererProps {
  node: LowCodeNode;
  children?: ReactNode;
}

type Renderer = (props: RendererProps) => JSX.Element;

const Container: Renderer = ({ node, children }) => {
  const layout = node.props.layout === "grid" ? "grid" : "stack";
  const className = layout === "grid" ? "container-grid" : "container-stack";
  return (
    <div className={className}>
      <div className="container-title">{node.label}</div>
      <div className="container-body">{children}</div>
    </div>
  );
};

const Text: Renderer = ({ node }) => {
  const variant = node.props.variant === "title" ? "text-title" : "text-body";
  return <p className={variant}>{node.props.text}</p>;
};

const Button: Renderer = ({ node }) => (
  <button className="button" type="button">
    {node.props.text ?? node.label}
  </button>
);

const Input: Renderer = ({ node }) => (
  <label className="field">
    <span>{node.label}</span>
    <input
      placeholder={String(node.props.placeholder ?? "")}
      readOnly
      value={node.props.value ? String(node.props.value) : ""}
    />
  </label>
);

const Select: Renderer = ({ node }) => (
  <label className="field">
    <span>{node.label}</span>
    <select disabled>
      {Array.from({ length: Number(node.props.options ?? 2) }).map((_, index) => (
        <option key={index}>选项 {index + 1}</option>
      ))}
    </select>
  </label>
);

const Table: Renderer = ({ node }) => {
  const columns = Number(node.props.columns ?? 3);
  const rows = Number(node.props.rows ?? 3);
  return (
    <div className="table">
      <div className="table-header">{node.label}</div>
      <div className="table-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={`header-${index}`} className="table-cell table-cell-head">
            列 {index + 1}
          </div>
        ))}
        {Array.from({ length: columns * rows }).map((_, index) => (
          <div key={`cell-${index}`} className="table-cell">
            数据
          </div>
        ))}
      </div>
    </div>
  );
};

export const registry: Record<NodeType, Renderer> = {
  container: Container,
  text: Text,
  button: Button,
  input: Input,
  select: Select,
  table: Table,
};

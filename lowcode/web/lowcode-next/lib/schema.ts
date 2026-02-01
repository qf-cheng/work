export type NodeType =
  | "container"
  | "text"
  | "button"
  | "input"
  | "select"
  | "table";

export interface LowCodeNode {
  id: string;
  type: NodeType;
  label: string;
  props: Record<string, string | number | boolean>;
  children?: string[];
}

export type LowCodeNodeMap = Record<string, LowCodeNode>;

export interface LowCodeSchema {
  rootId: string;
  nodes: LowCodeNodeMap;
}

export const initialSchema: LowCodeSchema = {
  rootId: "page",
  nodes: {
    page: {
      id: "page",
      type: "container",
      label: "页面容器",
      props: {
        layout: "grid",
        columns: 2,
      },
      children: ["title", "form", "table"],
    },
    title: {
      id: "title",
      type: "text",
      label: "页面标题",
      props: {
        text: "客户资料收集",
        variant: "title",
      },
    },
    form: {
      id: "form",
      type: "container",
      label: "表单容器",
      props: {
        layout: "stack",
        spacing: "md",
      },
      children: ["name", "level", "submit"],
    },
    name: {
      id: "name",
      type: "input",
      label: "客户名称",
      props: {
        placeholder: "请输入客户名称",
        required: true,
      },
    },
    level: {
      id: "level",
      type: "select",
      label: "客户等级",
      props: {
        options: 3,
      },
    },
    submit: {
      id: "submit",
      type: "button",
      label: "提交按钮",
      props: {
        text: "提交表单",
        tone: "primary",
      },
    },
    table: {
      id: "table",
      type: "table",
      label: "客户列表",
      props: {
        columns: 4,
        rows: 3,
      },
    },
  },
};

export function findNodeById(schema: LowCodeSchema, id: string) {
  return schema.nodes[id];
}

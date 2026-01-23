export const NODE_TPL = {
  Container: () => ({ type: "Container", props: {}, children: [] }),
  Row: () => ({ type: "Row", props: { gap: 8, wrap: true, align: "center" }, children: [] }),
  Col: () => ({ type: "Col", props: { flex: 1 }, children: [] }),

  Button: () => ({ type: "Button", text: "按钮", props: { size: "small" }, on: { click: "" } }),
  Input: () => ({ type: "Input", bind: "", props: { placeholder: "", size: "small" } }),
  Select: () => ({
    type: "Select",
    bind: "",
    options: [
      { label: "选项1", value: 1 },
      { label: "选项2", value: 2 },
    ],
    props: { clearable: false, size: "small" },
  }),

  Table: () => ({
    type: "Table",
    bind: "",
    props: {
      size: "small",
      columns: [{ prop: "id", label: "ID" }],
    },
    rowActions: [],
  }),

  Pagination: () => ({
    type: "Pagination",
    bindPagination: "",
    props: { pageSizes: [10, 20, 50, 100], layout: "total, sizes, prev, pager, next, jumper" },
    on: { change: "" },
  }),

  Dialog: () => ({
    type: "Dialog",
    title: "弹窗",
    bindVisible: "",
    on: { ok: "" },
    children: [
      { type: "Container", props: {}, children: [] }
    ],
  }),

  Form: () => ({ type: "Form", props: { labelWidth: "80px" }, children: [] }),
  FormItem: () => ({ type: "FormItem", label: "字段", children: [{ type: "Input", bind: "", props: { placeholder: "" } }] }),
};

export const NODE_PROP_DEFS = {
  Container: [
    {
      key: "justify",
      label: "justify",
      type: "select",
      options: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"],
    },
    {
      key: "align",
      label: "align",
      type: "select",
      options: ["stretch", "flex-start", "center", "flex-end", "baseline"],
    },
    { key: "gap", label: "gap", type: "number", min: 0, step: 1 },
    { key: "padding", label: "padding", type: "string", placeholder: "8px" },
    { key: "margin", label: "margin", type: "string", placeholder: "0" },
    { key: "width", label: "width", type: "string", placeholder: "100%" },
    { key: "height", label: "height", type: "string", placeholder: "auto" },
  ],
  Row: [
    { key: "gap", label: "gap", type: "number", min: 0, step: 1 },
    { key: "wrap", label: "wrap", type: "boolean" },
    {
      key: "align",
      label: "align",
      type: "select",
      options: ["stretch", "flex-start", "center", "flex-end", "baseline"],
    },
    {
      key: "justify",
      label: "justify",
      type: "select",
      options: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"],
    },
  ],
  Col: [
    { key: "width", label: "width", type: "string", placeholder: "200px/30%" },
    { key: "flex", label: "flex", type: "number", min: 0, step: 1 },
    {
      key: "align",
      label: "align",
      type: "select",
      options: ["stretch", "flex-start", "center", "flex-end", "baseline"],
    },
    {
      key: "justify",
      label: "justify",
      type: "select",
      options: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"],
    },
  ],
  Card: [
    { key: "shadow", label: "shadow", type: "select", options: ["always", "hover", "never"] },
  ],
  Button: [
    {
      key: "type",
      label: "type",
      type: "select",
      options: ["", "primary", "success", "warning", "danger", "info", "text"],
    },
    { key: "size", label: "size", type: "select", options: ["medium", "small", "mini"] },
  ],
  Input: [
    { key: "placeholder", label: "placeholder", type: "string" },
    { key: "clearable", label: "clearable", type: "boolean" },
    { key: "disabled", label: "disabled", type: "boolean" },
    { key: "size", label: "size", type: "select", options: ["medium", "small", "mini"] },
  ],
  Select: [
    { key: "placeholder", label: "placeholder", type: "string" },
    { key: "clearable", label: "clearable", type: "boolean" },
    { key: "filterable", label: "filterable", type: "boolean" },
    { key: "disabled", label: "disabled", type: "boolean" },
    { key: "size", label: "size", type: "select", options: ["medium", "small", "mini"] },
  ],
  Table: [
    { key: "size", label: "size", type: "select", options: ["medium", "small", "mini"] },
    { key: "stripe", label: "stripe", type: "boolean" },
    { key: "border", label: "border", type: "boolean" },
  ],
  Pagination: [
    { key: "pageSizes", label: "pageSizes", type: "array", itemType: "number" },
    { key: "layout", label: "layout", type: "string" },
  ],
  Dialog: [
    { key: "width", label: "width", type: "string", placeholder: "520px" },
  ],
  Form: [
    { key: "labelWidth", label: "labelWidth", type: "string", placeholder: "80px" },
  ],
};

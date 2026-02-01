export type ActionId = string;

export type ActionDef =
  | FlowAction
  | BranchAction
  | ResourceAction
  | SetAction;

export interface FlowAction {
  type: "flow";
  steps: Array<ActionId | ActionDef>;
}

export interface BranchAction {
  type: "branch";
  value: string;
  cases: Record<string, ActionId>;
  default?: ActionId;
}

export type ResourceActionType =
  | "resource.list"
  | "resource.detail"
  | "resource.create"
  | "resource.update"
  | "resource.remove";

export interface ResourceAction {
  type: ResourceActionType;
  resource: string;
  to?: string;
  id?: string;
  data?: unknown;
  pageNo?: number | string;
  pageSize?: number | string;
  condition?: unknown;
}

export interface SetAction {
  type: "set";
  to: string;
  value: unknown;
}

export interface PageSchema {
  id: string;
  title: string;
  rootInit?: {
    $data?: Record<string, unknown>;
    $ui?: Record<string, unknown>;
    $tmp?: Record<string, unknown>;
  };
  actions?: Record<ActionId, ActionDef>;
  onLoadAction?: ActionId;
  layout: LayoutNode;
}

export interface RuntimeRoot {
  $meta: { pageId: string; ts: number };
  $data: Record<string, unknown>;
  $ui: Record<string, unknown>;
  $tmp: Record<string, unknown>;
}

export interface ResourceField {
  field: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "oid";
}

export interface ResourceSchema {
  name: string;
  collection: string;
  schema: ResourceField[];
  options?: Record<string, unknown>;
}

export interface LayoutNode {
  id: string;
  type:
    | "Container"
    | "Text"
    | "Button"
    | "Input"
    | "Select"
    | "Table"
    | "Pagination"
    | "Dialog"
    | "Form"
    | "FormItem";
  label?: string;
  text?: string;
  props?: Record<string, unknown>;
  bind?: string;
  bindVisible?: string;
  bindPagination?: string;
  on?: Record<string, ActionId>;
  options?: Array<{ label: string; value: string | number }>;
  children?: LayoutNode[];
  rowActions?: Array<{ label: string; action: ActionId; type?: string }>;
}

export const initialPageSchema: PageSchema = {
  id: "admin_list",
  title: "page管理",
  rootInit: {
    $data: {
      query: { key: "", title: "" },
      pageList: {
        docs: [
          { _id: "1", key: "home", title: "首页", routePath: "/", status: "draft" },
          { _id: "2", key: "users", title: "用户管理", routePath: "/users", status: "published" },
        ],
        pagination: { pageNo: 1, pageSize: 10, total: 2 },
      },
      editing: {
        id: "",
        mode: "create",
        form: { key: "", title: "", routePath: "", status: "draft" },
      },
    },
    $ui: {
      dlgEditVisible: false,
    },
  },
  actions: {
    loadPages: {
      type: "resource.list",
      resource: "page",
      to: "$data.pageList",
      pageNo: "$data.pageList.pagination.pageNo",
      pageSize: "$data.pageList.pagination.pageSize",
      condition: "$data.query",
    },
    save: {
      type: "branch",
      value: "$data.editing.mode",
      cases: {
        create: "saveCreate",
        edit: "saveEdit",
      },
    },
    openCreate: {
      type: "flow",
      steps: [
        { type: "set", to: "$data.editing.mode", value: "create" },
        { type: "set", to: "$ui.dlgEditVisible", value: true },
        {
          type: "set",
          to: "$data.editing.form",
          value: {
            key: "",
            title: "",
            routePath: "",
            status: "draft",
          },
        },
      ],
    },
    openEdit: {
      type: "flow",
      steps: [
        { type: "set", to: "$data.editing.mode", value: "edit" },
        {
          type: "resource.detail",
          resource: "page",
          id: "$ctx.row._id",
          to: "$data.editing.form",
        },
        { type: "set", to: "$ui.dlgEditVisible", value: true },
      ],
    },
    saveEdit: {
      type: "flow",
      steps: [
        {
          type: "resource.update",
          resource: "page",
          id: "$data.editing.form._id",
          data: "$data.editing.form",
        },
        "loadPages",
      ],
    },
    saveCreate: {
      type: "flow",
      steps: [
        {
          type: "resource.create",
          resource: "page",
          data: "$data.editing.form",
        },
        "loadPages",
      ],
    },
    removePage: {
      type: "flow",
      steps: [
        { type: "resource.remove", resource: "page", id: "$ctx.row._id" },
        "loadPages",
      ],
    },
  },
  onLoadAction: "loadPages",
  layout: {
    id: "root",
    type: "Container",
    props: { layout: "stack", gap: 12 },
    children: [
      {
        id: "toolbar",
        type: "Container",
        props: { layout: "row", justify: "space-between", gap: 12 },
        children: [
          {
            id: "toolbar-left",
            type: "Container",
            props: { layout: "row", gap: 8 },
            children: [
              { id: "refresh", type: "Button", text: "刷新", on: { click: "loadPages" } },
              { id: "create", type: "Button", text: "新增", on: { click: "openCreate" } },
            ],
          },
          {
            id: "toolbar-right",
            type: "Container",
            props: { layout: "row", gap: 8 },
            children: [
              {
                id: "query-key",
                type: "Input",
                label: "页面key",
                props: { placeholder: "请输入页面key" },
                bind: "$data.query.key",
              },
              { id: "search", type: "Button", text: "查询", on: { click: "loadPages" } },
            ],
          },
        ],
      },
      {
        id: "table",
        type: "Table",
        bind: "$data.pageList",
        props: {
          columns: [
            { prop: "key", label: "页面key" },
            { prop: "title", label: "页面标题" },
            { prop: "routePath", label: "路由路径" },
            { prop: "status", label: "状态" },
          ],
        },
        rowActions: [
          { label: "编辑", action: "openEdit" },
          { label: "删除", action: "removePage", type: "danger" },
        ],
      },
      {
        id: "pagination",
        type: "Pagination",
        bindPagination: "$data.pageList.pagination",
        on: { change: "loadPages" },
      },
      {
        id: "dialog",
        type: "Dialog",
        label: "编辑页面",
        bindVisible: "$ui.dlgEditVisible",
        on: { ok: "save" },
        children: [
          {
            id: "form",
            type: "Form",
            props: { model: "$data.editing.form" },
            children: [
              {
                id: "form-key",
                type: "FormItem",
                label: "页面key",
                children: [
                  {
                    id: "input-key",
                    type: "Input",
                    bind: "$data.editing.form.key",
                    props: { placeholder: "请输入页面key" },
                  },
                ],
              },
              {
                id: "form-title",
                type: "FormItem",
                label: "页面标题",
                children: [
                  {
                    id: "input-title",
                    type: "Input",
                    bind: "$data.editing.form.title",
                    props: { placeholder: "请输入页面标题" },
                  },
                ],
              },
              {
                id: "form-route",
                type: "FormItem",
                label: "路由路径",
                children: [
                  {
                    id: "input-route",
                    type: "Input",
                    bind: "$data.editing.form.routePath",
                    props: { placeholder: "请输入路由路径" },
                  },
                ],
              },
              {
                id: "form-status",
                type: "FormItem",
                label: "状态",
                children: [
                  {
                    id: "select-status",
                    type: "Select",
                    bind: "$data.editing.form.status",
                    options: [
                      { label: "草稿", value: "draft" },
                      { label: "测试", value: "test" },
                      { label: "发布", value: "published" },
                      { label: "禁用", value: "disabled" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

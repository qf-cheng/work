# Low-code 核心架构（现状梳理 + 改版参考）

> 目标：基于现有 Vue2/Express 版本的核心能力，抽象出可迁移到 Next.js 的架构与业务细节。

## 1. 总览（运行时闭环）

当前实现的低代码核心由 **页面 schema + 运行时状态 + 动作系统 + 通用资源 API** 构成：

- **页面 schema** 描述 UI 结构、事件绑定、以及业务动作引用。前端通过 `layout` 树渲染组件，节点上通过 `on` 或 `bind` 关联运行时状态与动作。参考 `web/lowCode/local/page.js` 中的示例页面配置（`layout`、`actions`、`rootInit`）。【F:web/lowCode/local/page.js†L1-L189】
- **运行时状态** 由 `$data`、`$ui`、`$tmp` 组成，统一挂在 `root` 对象上，并通过路径表达式读写；`createRuntime` 初始化并提供 `runAction` 等能力。【F:web/lowCode/runtime/createRuntime.js†L39-L176】
- **动作系统** 基于 `flow`、`branch`、`resource.*` 和 `set` 等类型，通过 `runAction` 串联执行，负责流程控制与数据请求。核心逻辑见 `createRuntime`。【F:web/lowCode/runtime/createRuntime.js†L65-L149】
- **通用资源 API** 由后端 `ResourceRegistry + MongoResourceService` 驱动，提供统一 CRUD 路由 `/lowCode/:resource`，前端通过 `api/common.js` 封装调用。【F:server/service/lowCodeService.js†L37-L174】【F:server/router/lowCode.js†L133-L234】【F:web/lowCode/api/common.js†L33-L96】

该闭环实现了：**页面 JSON 驱动 UI + 动作驱动状态/数据 + 资源注册实现数据库穿透**。

## 2. 运行时状态模型（$data / $ui / $tmp）

`createRuntime` 在 `root` 上维护三类状态：

- `$data`：业务数据（列表、表单、查询条件等），页面实体均绑定在此处。初始化来自 `rootInit.$data`。【F:web/lowCode/runtime/createRuntime.js†L39-L55】
- `$ui`：界面状态（弹窗开关、激活 tab 等），初始化来自 `rootInit.$ui`。【F:web/lowCode/runtime/createRuntime.js†L39-L55】
- `$tmp`：临时状态（中间变量、计算缓存），初始化来自 `rootInit.$tmp`。【F:web/lowCode/runtime/createRuntime.js†L39-L56】

**路径读写规则**：

- `getByPath` / `setByPath` 支持带 `$` 的绝对路径和不带 `$` 的默认 `$data.*` 语义。【F:web/lowCode/runtime/createRuntime.js†L12-L35】
- 动作里的参数可写成 `$data.xxx` / `$ui.xxx` / `$tmp.xxx`；此外还支持 `$ctx.xxx` 读取事件上下文（如表格行）。【F:web/lowCode/runtime/createRuntime.js†L37-L63】【F:web/lowCode/runtime/createRuntime.js†L73-L107】

## 3. 动作系统（flow / branch / resource / set）

动作定义位于页面 schema 的 `actions` 字段，例如 `local/page.js`：

- **flow**：顺序执行 `steps` 数组；step 可是 actionId 字符串，也可为内联 action 对象。【F:web/lowCode/runtime/createRuntime.js†L71-L86】【F:web/lowCode/local/page.js†L26-L116】
- **branch**：对 `value` 进行条件分支，匹配 `cases` 或 `default` 指向下一个 action。【F:web/lowCode/runtime/createRuntime.js†L87-L97】【F:web/lowCode/local/page.js†L16-L33】
- **resource.list/detail/create/update/remove**：通用 CRUD 动作，调用后端资源 API 并将结果写回 `root`（如 `$data.pageList`）。【F:web/lowCode/runtime/createRuntime.js†L99-L138】【F:web/lowCode/local/page.js†L16-L116】
- **set**：将解析后的值写入指定路径（支持 `$data/$ui/$tmp`）。【F:web/lowCode/runtime/createRuntime.js†L140-L147】

**补充细节**：

- `runInline` 允许在 flow 中直接执行内联定义的 action（通过注入临时 actionId 实现）。【F:web/lowCode/runtime/createRuntime.js†L151-L171】
- 动作可以通过 `$ctx` 访问事件上下文，例如 `openEdit` 中使用 `$ctx.row._id`。【F:web/lowCode/local/page.js†L44-L57】

## 4. UI Schema 与事件绑定

`layout` 是组件树：

- 节点 `type` 决定组件，`props` 对应组件属性，`children` 形成树结构。示例页包含 `Container/Table/Form/Dialog` 等组件。【F:web/lowCode/local/page.js†L104-L189】
- `bind`/`bindVisible`/`bindPagination` 等字段将组件与 `$data`/`$ui` 路径绑定。示例包括表格数据、对话框显示状态、表单字段等。【F:web/lowCode/local/page.js†L104-L189】
- `on` 字段（如 `on: { click: 'loadPages' }`）通过 actionId 触发动作系统。【F:web/lowCode/local/page.js†L117-L143】

## 5. 后端资源注册与 CRUD

后端实现通过 `ResourceRegistry` + `MongoResourceService` 提供通用 CRUD 能力：

- **注册资源**：资源配置包含 `name`、`collection`、`schema`、`options` 等元信息。初始化资源列表在 `router/lowCode.js` 中定义 `defaultSchemas` 并注册。【F:server/router/lowCode.js†L9-L127】
- **资源注册器**：`ResourceRegistry` 负责注册、获取、列举资源，并为资源写入默认 `options`（软删、自动字段等）。【F:server/service/lowCodeService.js†L37-L77】
- **资源服务**：`MongoResourceService` 使用 `CollectionRepo` 实现 `list/detail/create/update/remove`，默认处理软删（`deleted=false`）。【F:server/service/lowCodeService.js†L79-L174】
- **路由**：统一 API 在 `/lowCode` 下，包含 `GET /resources` 与 `GET/POST/PATCH/DELETE /:resource` 等接口。【F:server/router/lowCode.js†L133-L234】

## 6. 前后端透传链路

- 前端调用：`api/common.js` 将 `resource.*` 动作映射到 `/lowCode/:resource` 的 CRUD 路由，并对后端返回 `{ ok, data }` 进行 unwrap。【F:web/lowCode/api/common.js†L1-L96】
- 运行时动作：`createRuntime` 中的 `resource.*` 动作调用上述 API，并通过 `setByPath` 写回 `$data`。【F:web/lowCode/runtime/createRuntime.js†L99-L138】
- 这套链路实现了“页面表单数据 -> 通用资源 API -> 数据库”穿透式流程。

## 7. 现状特点与改版重点

### 现有实现的关键能力（需保留）
1. **统一动作 DSL**：`flow/branch/set/resource.*` 基本覆盖常规业务流程控制。【F:web/lowCode/runtime/createRuntime.js†L65-L149】
2. **统一资源注册与 CRUD**：通过 registry + service 将 schema 绑定到 Mongo collection，减少后端定制路由。【F:server/service/lowCodeService.js†L37-L174】【F:server/router/lowCode.js†L133-L234】
3. **运行时状态模型清晰**：`$data/$ui/$tmp` 能区分业务数据、UI 状态与临时变量。【F:web/lowCode/runtime/createRuntime.js†L39-L56】

### 建议补充/增强设计点
- **类型系统**：对 schema、action、resource 的结构加 TS 类型约束，避免运行时错配（Next.js 迁移的核心收益之一）。
- **动作可观测性**：动作执行链加入事件日志/调试面板；为 `runAction` 增加执行上下文与 traceId。
- **资源与数据源解耦**：目前 registry/CRUD 偏向 Mongo；后续应将 datasource（http/mongo）抽象为插件或 provider（示例 datasource 配置在 `datasourceService.js` 中）。【F:server/service/datasourceService.js†L1-L50】
- **运行时渲染器抽象**：将 `layout` 渲染器拆成组件 registry + 渲染器（类似现有 Next.js scaffold 但需与 schema 对齐）。

## 8. Next.js 改版建议的文件结构（建议）

> 以下是建议目标结构，不是当前代码。

- `packages/core/schema`：schema/action/resource 类型定义
- `packages/core/runtime`：`createRuntime` & action 执行器
- `packages/web-editor`：schema 编辑器（tree + props + action flow）
- `packages/web-renderer`：运行时渲染器（组件 registry）
- `packages/server`：ResourceRegistry + ResourceService + datasource provider

该结构有助于把 UI 与运行时逻辑解耦，便于多端复用（Web/H5）。

## 9. 基础架构完整代码设计（Next.js 优先，Nest 可选）

> 目标：先在 Next.js 内实现基础后端能力（API routes），满足资源 CRUD 与页面渲染；后续可平滑迁移到 Nest。

### 9.1 模块边界与职责

- **schema 包**：维护 UI schema、动作 DSL、资源定义的 TypeScript 类型。
- **runtime 包**：提供运行时状态容器、路径解析器、动作执行器。
- **renderer 包**：负责组件注册表与 schema 渲染器（与 UI 层解耦）。
- **editor 包**：负责 schema 编辑器（树/属性/动作流）。
- **server 包**：提供通用资源 CRUD、注册器、数据源插件。

### 9.2 TypeScript 领域模型（建议字段）

- `PageSchema`：`id/title/rootInit/layout/actions/onLoadAction` 等。
- `ActionDef`：`flow/branch/resource/*/set` 四类核心动作。
- `ResourceSchema`：`name/collection/schema/options`。
- `RuntimeRoot`：`$data/$ui/$tmp/$meta` 状态树。

### 9.3 Runtime 执行器（建议 API）

- `createRuntime(schema)` -> `{ root, runAction, getValue, setValue }`
- `runAction(actionId, ctx)` 支持 flow/branch/resource/set 与 inline action。
- `resolveValue` 支持 `$data/$ui/$tmp/$ctx` 语义。

### 9.4 Server API 设计（Next.js 方案）

> 采用 Next.js `app/api` 路由快速落地（后续可迁移到 Nest Controller）。

- `GET /api/resources` -> list registry
- `GET /api/:resource` -> list
- `GET /api/:resource/:id` -> detail
- `POST /api/:resource` -> create
- `PATCH /api/:resource/:id` -> update
- `DELETE /api/:resource/:id` -> remove

底层逻辑复用 `ResourceRegistry` + `ResourceService`，数据源默认 Mongo，后续可以扩展为 `HttpDatasourceProvider`。

### 9.5 数据源插件化（建议接口）

- `DatasourceProvider`：
  - `list(resource, params)`
  - `detail(resource, id)`
  - `create(resource, payload)`
  - `update(resource, id, payload)`
  - `remove(resource, id)`
- `Registry` 内保存 resource -> datasourceType 映射。

### 9.6 渲染器与组件注册表

- `RendererRegistry`：`register(type, component)` / `get(type)`
- `NodeRenderer`：递归渲染 `layout` 树，并注入 runtime 绑定能力（bind/on）。

### 9.7 编辑器与设计时态

- 设计时与运行时分离：编辑器只改 schema（增删改查），运行时只消费 schema。
- Schema 版本控制：支持 `version` + `history`，便于差异对比。

### 9.8 迁移路径

1. 抽象 TypeScript schema 与 runtime 包，保持 Vue 端可对接（行为一致）。
2. 在 Next.js 中复用 runtime + renderer，实现 React 渲染器。
3. 将 Express 路由迁移为 Next.js API（或 Nest Controller）。
4. 收敛 schema 编辑器到 React 版本。

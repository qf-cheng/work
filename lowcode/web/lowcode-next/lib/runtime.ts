import type { ActionDef, ActionId, PageSchema, RuntimeRoot } from "./schema";

export interface RuntimeOptions {
  resourceAdapter?: ResourceAdapter;
  onError?: (error: Error, context: { actionId: ActionId; def: ActionDef; ctx: unknown }) => void;
  onChange?: () => void;
}

export interface ResourceAdapter {
  list: (resource: string, params: { pageNo: number; pageSize: number; condition: unknown }) => Promise<unknown>;
  detail: (resource: string, id: string) => Promise<unknown>;
  create: (resource: string, payload: unknown) => Promise<unknown>;
  update: (resource: string, id: string, payload: unknown) => Promise<unknown>;
  remove: (resource: string, id: string) => Promise<unknown>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getByPath(obj: RuntimeRoot, path?: string) {
  if (!path) return undefined;
  const normalized = path.startsWith("$") ? path : `$data.${path}`;
  const keys = normalized.split(".").filter(Boolean);
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function setByPath(obj: RuntimeRoot, path: string, value: unknown, onChange?: () => void) {
  if (!path) return;
  const normalized = path.startsWith("$") ? path : `$data.${path}`;
  const keys = normalized.split(".").filter(Boolean);
  let current: Record<string, unknown> = obj as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!isObject(current[key])) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value as unknown;
  if (onChange) onChange();
}

function resolveValue(root: RuntimeRoot, value: unknown, ctx: Record<string, unknown>) {
  if (typeof value === "string") {
    if (value.startsWith("$ctx.")) {
      const path = value.replace("$ctx.", "");
      return path.split(".").reduce((acc, key) => {
        if (acc == null || typeof acc !== "object") return undefined;
        return (acc as Record<string, unknown>)[key];
      }, ctx as unknown);
    }
    if (value.startsWith("$")) {
      return getByPath(root, value);
    }
  }
  return value;
}

export function createRuntime(schema: PageSchema, options: RuntimeOptions = {}) {
  const root: RuntimeRoot = {
    $meta: { pageId: schema.id, ts: Date.now() },
    $data: schema.rootInit?.$data ?? {},
    $ui: schema.rootInit?.$ui ?? {},
    $tmp: schema.rootInit?.$tmp ?? {},
  };

  const actions = schema.actions ?? {};
  const { resourceAdapter, onError, onChange } = options;

  async function runInline(def: ActionDef, ctx: Record<string, unknown>) {
    const inlineId = `__inline_${Math.random().toString(36).slice(2)}`;
    actions[inlineId] = def;
    try {
      return await runAction(inlineId, ctx);
    } finally {
      delete actions[inlineId];
    }
  }

  async function runAction(actionId: ActionId, ctx: Record<string, unknown> = {}) {
    const def = actions[actionId];
    if (!def) throw new Error(`action not found: ${actionId}`);

    try {
      if (def.type === "flow") {
        let last: unknown = null;
        for (const step of def.steps) {
          if (typeof step === "string") {
            last = await runAction(step, ctx);
          } else {
            last = await runInline(step, ctx);
          }
        }
        return last;
      }

      if (def.type === "branch") {
        const value = resolveValue(root, def.value, ctx);
        const next = def.cases[String(value)] ?? def.default;
        if (!next) return null;
        return await runAction(next, ctx);
      }

      if (def.type.startsWith("resource.")) {
        if (!resourceAdapter) throw new Error("resource adapter is required");
        if (def.type === "resource.list") {
          const pageNo = Number(resolveValue(root, def.pageNo ?? 1, ctx)) || 1;
          const pageSize = Number(resolveValue(root, def.pageSize ?? 20, ctx)) || 20;
          const condition = resolveValue(root, def.condition ?? {}, ctx) ?? {};
          const result = await resourceAdapter.list(def.resource, { pageNo, pageSize, condition });
          if (def.to) setByPath(root, def.to, result, onChange);
          return result;
        }
        if (def.type === "resource.detail") {
          const id = resolveValue(root, def.id, ctx);
          if (!id || typeof id !== "string") throw new Error("detail requires id");
          const result = await resourceAdapter.detail(def.resource, id);
          if (def.to) setByPath(root, def.to, result, onChange);
          return result;
        }
        if (def.type === "resource.create") {
          const payload = resolveValue(root, def.data ?? {}, ctx);
          const result = await resourceAdapter.create(def.resource, payload);
          if (def.to) setByPath(root, def.to, result, onChange);
          return result;
        }
        if (def.type === "resource.update") {
          const id = resolveValue(root, def.id, ctx);
          if (!id || typeof id !== "string") throw new Error("update requires id");
          const payload = resolveValue(root, def.data ?? {}, ctx);
          const result = await resourceAdapter.update(def.resource, id, payload);
          if (def.to) setByPath(root, def.to, result, onChange);
          return result;
        }
        if (def.type === "resource.remove") {
          const id = resolveValue(root, def.id, ctx);
          if (!id || typeof id !== "string") throw new Error("remove requires id");
          const result = await resourceAdapter.remove(def.resource, id);
          if (def.to) setByPath(root, def.to, result, onChange);
          return result;
        }
      }

      if (def.type === "set") {
        const value = resolveValue(root, def.value, ctx);
        setByPath(root, def.to, value, onChange);
        return value;
      }

      throw new Error(`unsupported action type: ${def.type}`);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error, { actionId, def, ctx });
      }
      throw error;
    }
  }

  return {
    root,
    actions,
    runAction,
    getValue: (path: string) => getByPath(root, path),
    setValue: (path: string, value: unknown) => setByPath(root, path, value, onChange),
  };
}

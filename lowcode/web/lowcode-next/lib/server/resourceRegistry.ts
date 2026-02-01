import type { ResourceSchema } from "../schema";

export interface ListResult {
  docs: Array<Record<string, unknown>>;
  pagination: { pageNo: number; pageSize: number; total: number };
}

export class ResourceRegistry {
  private map = new Map<string, ResourceSchema>();

  constructor(initialResources: ResourceSchema[] = []) {
    initialResources.forEach((resource) => this.register(resource));
  }

  register(resource: ResourceSchema) {
    if (!resource.name) throw new Error("resource.name is required");
    if (!resource.collection) throw new Error("resource.collection is required");
    this.map.set(resource.name, resource);
  }

  list() {
    return Array.from(this.map.values());
  }

  get(name: string) {
    return this.map.get(name) ?? null;
  }
}

export class InMemoryResourceService {
  private store = new Map<string, Array<Record<string, unknown>>>();

  constructor(private registry: ResourceRegistry) {}

  private ensure(resourceName: string) {
    if (!this.registry.get(resourceName)) {
      throw new Error(`Unknown resource: ${resourceName}`);
    }
    if (!this.store.has(resourceName)) {
      this.store.set(resourceName, []);
    }
    return this.store.get(resourceName) as Array<Record<string, unknown>>;
  }

  list(resourceName: string, pageNo = 1, pageSize = 20, condition: Record<string, unknown> = {}) {
    const records = this.ensure(resourceName);
    const filtered = records.filter((record) => {
      return Object.entries(condition).every(([key, value]) => record[key] === value);
    });
    const start = (pageNo - 1) * pageSize;
    const docs = filtered.slice(start, start + pageSize);
    return {
      docs,
      pagination: { pageNo, pageSize, total: filtered.length },
    } satisfies ListResult;
  }

  detail(resourceName: string, id: string) {
    const records = this.ensure(resourceName);
    return records.find((record) => record._id === id) ?? null;
  }

  create(resourceName: string, payload: Record<string, unknown>) {
    const records = this.ensure(resourceName);
    const doc = { ...payload, _id: payload._id ?? crypto.randomUUID() };
    records.push(doc);
    return doc;
  }

  update(resourceName: string, id: string, payload: Record<string, unknown>) {
    const records = this.ensure(resourceName);
    const index = records.findIndex((record) => record._id === id);
    if (index === -1) return null;
    records[index] = { ...records[index], ...payload };
    return records[index];
  }

  remove(resourceName: string, id: string) {
    const records = this.ensure(resourceName);
    const index = records.findIndex((record) => record._id === id);
    if (index === -1) return null;
    const [removed] = records.splice(index, 1);
    return removed;
  }
}

export const defaultRegistry = new ResourceRegistry([
  {
    name: "page",
    collection: "low-code-page",
    schema: [
      { field: "key", type: "string" },
      { field: "title", type: "string" },
      { field: "routePath", type: "string" },
      { field: "status", type: "string" },
    ],
  },
]);

export const defaultService = new InMemoryResourceService(defaultRegistry);

const seedPages = defaultService.list("page", 1, 1).docs.length === 0;
if (seedPages) {
  defaultService.create("page", {
    key: "home",
    title: "首页",
    routePath: "/",
    status: "draft",
  });
  defaultService.create("page", {
    key: "users",
    title: "用户管理",
    routePath: "/users",
    status: "published",
  });
}

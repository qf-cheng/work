import type { ResourceAdapter } from "./runtime";

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return (await response.json()) as T;
}

export const resourceClient: ResourceAdapter = {
  async list(resource, params) {
    const query = new URLSearchParams({
      pageNo: String(params.pageNo),
      pageSize: String(params.pageSize),
      condition: JSON.stringify(params.condition ?? {}),
    });
    return unwrap(await fetch(`/api/${resource}?${query.toString()}`));
  },
  async detail(resource, id) {
    return unwrap(await fetch(`/api/${resource}/${id}`));
  },
  async create(resource, payload) {
    return unwrap(
      await fetch(`/api/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      })
    );
  },
  async update(resource, id, payload) {
    return unwrap(
      await fetch(`/api/${resource}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      })
    );
  },
  async remove(resource, id) {
    return unwrap(
      await fetch(`/api/${resource}/${id}`, {
        method: "DELETE" },
      )
    );
  },
};

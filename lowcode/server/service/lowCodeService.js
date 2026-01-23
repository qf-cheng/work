/**
 * @description 低代码服务，提供资源注册器和资源服务。
 * createAt: 2026-01-07
 * updateAt: 2026-01-07
 * author: wudongcheng 
 */

const { CollectionRepo } = require('../../utils/mongoQueryUtils');

// -------------------- helpers --------------------
function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function ok(data = {}) {
  return { ok: true, data, error: null };
}
function fail(err, data = {}) {
  return { ok: false, data, error: String(err?.message || err || '') };
}
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(String(str));
  } catch {
    return fallback;
  }
}
function buildIdCondition(id) {
  return { match: [{ key: '_id', op: 'eq', value: id, strict: true }] };
}

/**
 * 资源配置最小模型（基础版）
 * - name: 资源名（URL上用）
 * - collection: Mongo collection 名
 * - options: 这个资源的通用行为（软删/自动日期等）
 *
 * 后期你可以把它存到 Mongo：resources 配置表
 */
class ResourceRegistry {
  constructor(initialResources = []) {
    this.map = new Map();
    initialResources.forEach(r => this.register(r));
  }

  register(resourceConfig) {
    if (!resourceConfig?.name) throw new Error('resource.name is required');
    if (!resourceConfig?.collection) throw new Error('resource.collection is required');
    this.map.set(resourceConfig.name, {
      ...resourceConfig,
      options: {
        softDelete: true,
        ...resourceConfig.options || {},
        createOptions: { useDate: true, useId: false, deleteMark: true, enableMark: false, autoUid: false, ...(resourceConfig.options?.createOptions || {}) },
      },
    });
  }

  has(name) {
    return this.map.has(name);
  }

  get(name) {
    return this.map.get(name) || null;
  }

  list() {
    return Array.from(this.map.values()).map(r => ({
      name: r.name,
      collection: r.collection,
      options: r.options,
      title: r.title,
      desc: r.desc,
    }));
  }
}

// -------------------- Service (resource-driven) --------------------
class MongoResourceService {
  /**
   * @param {import('mongodb').Db} mongoDb  注意：这里是 Db，不是 Collection
   * @param {ResourceRegistry} registry
   */
  constructor(mongoDb, registry) {
    this.db = mongoDb;
    this.registry = registry;
  }

  _mustGetResource(resourceName) {
    const resource = this.registry.get(resourceName);
    if (!resource) throw new Error(`Unknown resource: ${resourceName}`);
    return resource;
  }

  _getCollection(resource) {
    return this.db.collection(resource.collection);
  }

  _getRepo(resource) {
    return new CollectionRepo(this._getCollection(resource));
  }

  async list(resourceName, params = {}) {
    const resource = this._mustGetResource(resourceName);
    const repo = this._getRepo(resource);

    const pageNo = toInt(params.pageNo, 1);
    const pageSize = toInt(params.pageSize, 10);
    const condition = params.condition || {};

    // 基础版：如果软删，默认过滤 deleted=false（前提是 addOne 打了 deleteMark）
    if (resource.options?.softDelete) {
      condition.match = Array.isArray(condition.match) ? condition.match : [];
      if (resource.options?.createOptions?.deleteMark) condition.match.push({ field: 'deleted', op: 'eq', value: false, strict: true });
    }

    return await repo.getList(pageNo, pageSize, condition);
  }

  async detail(resourceName, id) {
    if (!id) return fail('id is required');
    const condition = buildIdCondition(id);
    const res = await this.list(resourceName, { pageNo: 1, pageSize: 1, condition });
    if (!res.ok) return res;
    const doc = (res.data?.docs || [])[0] || null;
    return ok({ doc });
  }

  async create(resourceName, payload = {}) {
    const resource = this._mustGetResource(resourceName);
    const repo = this._getRepo(resource);
    return repo.addOne(payload, resource.options?.createOptions);
  }

  async update(resourceName, id, payload = {}, condition = {}) {
    if (!id) return fail('id is required');
    const resource = this._mustGetResource(resourceName);
    const repo = this._getRepo(resource);

    condition.match = condition.match || [{ key: '_id', op: 'eq', value: id, strict: true }];
    return repo.updateOne(payload, condition);
  }

  async remove(resourceName, id) {
    if (!id) return fail('id is required');
    const resource = this._mustGetResource(resourceName);
    const repo = this._getRepo(resource);
    const condition = buildIdCondition(id);

    if (resource.options?.softDelete) return await repo.deleteOne(condition);
    return repo.destroy(condition);
  }

  async listWithArrays(resourceName, params = {}) {
    const resource = this._mustGetResource(resourceName);
    const repo = this._getRepo(resource);

    const pageNo = toInt(params.pageNo, 1);
    const pageSize = toInt(params.pageSize, 10);
    const condition = params.condition || {};
    const arrayProjections = Array.isArray(params.arrayProjections) ? params.arrayProjections : [];

    if (resource.options?.softDelete) {
      condition.match = Array.isArray(condition.match) ? condition.match : [];
      const hasDeleted = condition.match.some(m => (m.field || m.key) === 'deleted');
      if (!hasDeleted) condition.match.push({ field: 'deleted', op: 'eq', value: false, strict: true });
    }

    return repo.getListWithArrays(pageNo, pageSize, condition, arrayProjections);
  }
}


module.exports = {
  safeJsonParse,
  ResourceRegistry,
  MongoResourceService,
};
class MongoSchema {
  constructor(def = {}) {
    this.collection = def.collection; // collectionName
    this.writeable = def.writeable || null; // ['name', 'age'] or null(all)
    this.readable = def.readable || null;
    this.system = {
      useDate: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      createdBy: 'createdBy',
      updatedBy: 'updatedBy',
      ...def.system,
    };
    this.softDelete = !!def.softDelete;
    this.deleteMark = def.deleteMark ?? true; // deleted=false
    // 未来可加：fields 类型定义、required、default、indexes...
    this.fields = def.fields || null;
  }

  // 写入过滤：后面你再真正开启白名单
  sanitizeWrite(payload = {}) {
    if (!payload || typeof payload !== 'object') return {};
    if (!Array.isArray(this.writeable)) return { ...payload };

    const out = {};
    for (const k of this.writeable) {
      if (Object.prototype.hasOwnProperty.call(payload, k)) out[k] = payload[k];
    }
    return out;
  }

  // 系统字段注入
  decorateSystemFields(payload = {}, ctx = {}, mode = 'create') {
    const out = { ...payload };
    if (this.system.useDate) {
      const now = new Date();
      if (mode === 'create' && this.system.createdAt) out[this.system.createdAt] = now;
      if (this.system.updatedAt) out[this.system.updatedAt] = now;
    }
    if (ctx?.uid) {
      if (mode === 'create' && this.system.createdBy) out[this.system.createdBy] = ctx.uid;
      if (this.system.updatedBy) out[this.system.updatedBy] = ctx.uid;
    }
    if (mode === 'create' && this.deleteMark) {
      out.deleted = false;
    }
    return out;
  }

  // 可选：把你的 condition 体系转换成 mongo filter（你现在 repo 已经做了就先不实现）
  buildQuery(condition = {}) {
    return condition; // 先透传，后续再扩展
  }
}

class ApiSchema {
  constructor(def = {}) {
    this.baseUrl = def.baseUrl; // datasource baseUrl
    this.timeout = def.timeout || 15000;
    this.auth = def.auth || null; // token/header/signature
    this.operations = def.operations || {}; // { opId: { method, path, paramsSchema, bodySchema, responseMap } }
  }

  getOperation(opId) {
    const op = this.operations?.[opId];
    if (!op) throw new Error(`Unknown operation: ${opId}`);
    return op;
  }

  // 先不做严格校验，后续你可以加 JSONSchema / zod 等
  validateInput() {
    return true;
  }

  // 模板替换（超轻量版）：支持 "{{ $data.xxx }}" 这种你后面可以接入更强的表达式
  _tpl(str, root) {
    if (typeof str !== 'string') return str;
    return str.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
      // expr 例：$data.form.name
      const path = expr.trim();
      const parts = path.split('.').filter(Boolean);
      let cur = root;
      for (const p of parts) cur = cur?.[p];
      return cur == null ? '' : String(cur);
    });
  }

  buildRequest(opId, input = {}, root = {}) {
    const op = this.getOperation(opId);
    this.validateInput(op, input);

    const method = (op.method || 'GET').toUpperCase();
    const path = this._tpl(op.path, root); // 支持 path 模板
    const url = this.baseUrl.replace(/\/$/, '') + path;

    // query/body 先透传（后面加白名单/类型校验）
    const query = input.query || {};
    const body = input.body || {};

    const headers = { ...(op.headers || {}) };
    // auth（后面你再完善）
    if (this.auth?.type === 'bearer' && this.auth?.token) {
      headers['Authorization'] = `Bearer ${this.auth.token}`;
    }

    return { method, url, query, body, headers, timeout: op.timeout || this.timeout };
  }

  mapResponse(opId, resp) {
    const op = this.getOperation(opId);
    const map = op.responseMap || null;
    if (!map) return { data: resp };

    // 简单 path 取值
    const pick = (obj, path) => {
      const parts = String(path).split('.').filter(Boolean);
      let cur = obj;
      for (const p of parts) cur = cur?.[p];
      return cur;
    };

    const data = {
      list: map.list ? pick(resp, map.list) : undefined,
      total: map.total ? pick(resp, map.total) : undefined,
      data: map.data ? pick(resp, map.data) : undefined,
    };
    return data;
  }
}

module.exports = {
  MongoSchema,
  ApiSchema,
};

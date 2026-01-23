const router = require('express').Router();
const {
  safeJsonParse,
  ResourceRegistry,
  MongoResourceService,
} = require('../../service/lowCode/lowCodeService.js');
const { getDefaultDb } = require('../../datasource/mongo/index.js');
const mongoDb = getDefaultDb();

const defaultSchemas = [
  {
    name: 'datasource',
    collection: 'low-code-datasource',
    schema: [
      { field: 'name', type: 'string' },
      { field: 'type', type: 'string' }, // mongo/http
      { field: 'config', type: 'object' }, // uri/baseUrl/auth等
      { field: 'models', type: 'array' }, // mongo models
      { field: 'operations', type: 'array' }, // http operations
    ],
  },
  {
    name: 'user',
    collection: 'low-code-user',
    options: {
      softDelete: false,
      createOptions: {
        deleteMark: false,
        useUid: true,
        useDate: false,
        useId: false,
        enableMark: false,
        useOid: false,
      },
    },
    schema: [
      { field: 'uid', type: 'string' },
      { field: 'nickName', type: 'string' },
      { field: 'email', type: 'string' },
      { field: 'favorites', type: 'array' },
      { field: 'roleIds', type: 'array' },
      { field: 'platformIds', type: 'array' },
      { field: 'accessModule', type: 'array' },
      { field: 'accessToken', type: 'string' },
      { field: 'createBy', type: 'string' },
      { field: 'createTime', type: 'number' },
      { field: 'lastOperTime', type: 'number' },
      { field: 'LCOperTime', type: 'number' },
      { field: 'status', type: 'number' },
      { field: 'emailVerified', type: 'boolean' },
      { field: 'gender', type: 'number' },
      { field: 'identifier', type: 'string' },
      { field: 'identifyType', type: 'string' },
      { field: 'language', type: 'string' },
      { field: 'nickName', type: 'string' },
      { field: 'platformIds', type: 'array' },
      { field: 'roleId', type: 'string' },
    ],
  },
  {
    name: 'role',
    collection: 'low-code-role',
    schema: [
      { field: 'name', type: 'string' },
      { field: 'desc', type: 'string' },
    ],
  },
  {
    name: 'permission',
    collection: 'low-code-permission',
    schema: [
      { field: 'roleId', type: 'string' },
      { field: 'pageName', type: 'string' },
      { field: 'actionIds', type: 'array' },
      { field: 'platformIds', type: 'array' },
    ],
  },
  {
    name: 'page',
    collection: 'low-code-page',
    schema: [
      { field: 'name', type: 'string' },
      { field: 'content', type: 'object' }, // 整页schema JSON
      { field: 'resourceSchemaIds', type: 'array' }, // 依赖引用（可选）
      { field: 'platformIds', type: 'array' },
      { field: 'version', type: 'number' }, // 可选
      { field: 'status', type: 'string' }, // draft/published 可选
    ],
  },
  {
    name: 'resourceSchema',
    collection: 'low-code-schema',
    schema: [
      { field: 'name', type: 'string' },
      { field: 'schema', type: 'array' },
    ],
  },
  {
    name: 'action',
    collection: 'low-code-action',
    schema: [
      { field: 'name', type: 'string' },
      { field: 'desc', type: 'string' },
    ],
  },
  {
    name: 'platform',
    collection: 'low-code-platform',
    schema: [
      { field: 'name', type: 'string' },
      { field: 'endpoint', type: 'string' },
      { field: 'desc', type: 'string' },
    ],
  },
  {
    name: 'channelCodeConfig',
    collection: 'channel-code-config',
    schema: [
      { field: '_id', type: 'oid' },
      { field: 'code', type: 'string' },
      { field: 'schemeUrl', type: 'string' },
      { field: 'creatorName', type: 'string' },
      { field: 'platform', type: 'string' },
      { field: 'appVersion', type: 'array' },
      { field: 'enabled', type: 'boolean' },
      { field: 'deleted', type: 'boolean' },
      { field: 'createTime', type: 'number' },
      { field: 'updateTime', type: 'number' },
    ],
  },
];

const registry = new ResourceRegistry(defaultSchemas);
const service = new MongoResourceService(mongoDb, registry);

// -------------------- Collections Admin (可选："控制新建 cl + 操作字段”入口) --------------------
// 列出现有集合（用于控制台/调试）
router.get('/collections', async (req, res) => {
  try {
    const cols = await mongoDb
      .listCollections({}, { nameOnly: true })
      .toArray();
    res.ok({ collections: cols.map((c) => c.name) });
  } catch (e) {
    res.fail(e);
  }
});

/**
 * 创建集合 +（可选）创建索引
 * body:
 * {
 *   "resource": { "name":"users", "collection":"users", "options": {...}, "title":"用户" },
 *   "indexes": [ { "keys": { "email": 1 }, "options": { "unique": true } } ]
 * }
 */
router.post('/collections', async (req, res) => {
  try {
    const { resource, indexes } = req.body || {};
    if (!resource?.name || !resource?.collection)
      return res.fail('resource.name and resource.collection are required');

    // 1) 创建 collection（存在则不会报错，但 createCollection 对已存在会报错）
    // 所以先查一下
    const exist = await mongoDb
      .listCollections({ name: resource.collection }, { nameOnly: true })
      .toArray();
    if (exist.length === 0) {
      await mongoDb.createCollection(resource.collection);
    }

    // 2) 注册资源（内存版；后期你可以改为写入 resources 配置表）
    registry.register(resource);

    // 3) 建索引（可选）
    if (Array.isArray(indexes) && indexes.length > 0) {
      const col = mongoDb.collection(resource.collection);
      for (const idx of indexes) {
        if (!idx?.keys) continue;
        await col.createIndex(idx.keys, idx.options || {});
      }
    }

    res.ok({ created: true, resource: registry.get(resource.name) });
  } catch (e) {
    res.fail(e);
  }
});

// -------------------- Generic Controller --------------------

// 资源列表：前端低代码用来拉“有哪些资源 + 元信息”
router.get('/resources', (req, res) => {
  res.ok({ resources: registry.list() });
});

// list：GET /:resource?pageNo=&pageSize=&condition=JSON
router.get('/:resource', async (req, res) => {
  try {
    const resourceName = req.params.resource;
    const condition = req.query.condition
      ? safeJsonParse(req.query.condition, null)
      : {};
    if (req.query.condition && !condition)
      return res.fail('condition must be valid JSON');

    const result = await service.list(resourceName, {
      pageNo: req.query.pageNo,
      pageSize: req.query.pageSize,
      condition,
    });
    res.ok(result);
  } catch (e) {
    res.fail(e);
  }
});

// arrays：POST /:resource/arrays
router.post('/:resource/arrays', async (req, res) => {
  try {
    const resourceName = req.params.resource;
    const { pageNo, pageSize, condition, arrayProjections } = req.body || {};
    const result = await service.listWithArrays(resourceName, {
      pageNo,
      pageSize,
      condition,
      arrayProjections,
    });
    res.ok(result);
  } catch (e) {
    res.fail(e);
  }
});

// detail：GET /:resource/:id
router.get('/:resource/:id', async (req, res) => {
  try {
    const result = await service.detail(req.params.resource, req.params.id);
    res.ok(result);
  } catch (e) {
    res.fail(e);
  }
});

// create：POST /:resource
router.post('/:resource', async (req, res) => {
  try {
    const result = await service.create(req.params.resource, req.body || {});
    res.ok(result);
  } catch (e) {
    res.fail(e);
  }
});

// update：PATCH /:resource/:id
router.patch('/:resource/:id', async (req, res) => {
  try {
    const result = await service.update(
      req.params.resource,
      req.params.id,
      req.body || {},
    );
    res.ok(result);
  } catch (e) {
    res.fail(e);
  }
});

// delete：DELETE /:resource/:id
router.delete('/:resource/:id', async (req, res) => {
  try {
    const result = await service.remove(req.params.resource, req.params.id);
    res.ok(result);
  } catch (e) {
    res.fail(e);
  }
});

module.exports = router;

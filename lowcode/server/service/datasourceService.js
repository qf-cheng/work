const { getDefaultDb } = require('../../datasource/mongo');
const { MongoResourceService, ResourceRegistry } = require('./lowCodeService');
const db = getDefaultDb();

// const mock =  {
//   schemas: [{
//     name: 'datasource',
//     collection: 'low-code-datasource',
//     schema: [
//       {field: 'name', type: 'string'},
//       {field: 'collection', type: 'string'},
//       {field: 'schema', type: 'array'},
//     ]
//   }],
//   data: {
//     name: 'datasource',
//     collection: 'low-code-datasource',
//     schema: [
//       {field: 'name', type: 'string'},
//       {field: 'collection', type: 'string'},
//       {field: 'schema', type: 'array'},
//       {field: 'data', type: 'object'},
//     ],
//   }
// }

// // 这是一个create路由的逻辑演示
// const create = async (req, res) => {
//   const { schemas, data } = req.body || mock;
//   const registry = new ResourceRegistry(schemas);
//   const service = new MongoResourceService(db, registry);
//   const result = await service.create(data);
//   res.json(result);
// }

const schemas = [{
  name: 'datasource',
  collection: 'low-code-datasource',
  schema: [
    {field: 'name', type: 'string'},
    {field: 'collection', type: 'string'},
    {field: 'schema', type: 'array'},
  ]
}];
const registry = new ResourceRegistry(schemas);

module.exports = new MongoResourceService(db, registry);

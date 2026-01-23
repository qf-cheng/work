const Router = require('express').Router;
const { SUCCESS, FAIL } = require('../../common/codes.js');
const { getDefaultDb } = require('../../datasource/mongo/index.js');
const CtlGateway = Router();
const router = Router();
const ok = (data) => ({...SUCCESS, data});
const fail = (err) => ({...FAIL, error: String(err?.message || err || '') });
const db = getDefaultDb();

const routerMiddlewares = [
  // 验权和用户数据同步
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) throw new Error('user is required');

      // ctx上下文处理
      req.ctx = {
        uid: user.uid,
        tenantId: user.tenantId,
        traceId: req.headers['x-trace-id'] || `#timeTraceId:${new Date().getTime().toString()}`,
      };

      // sync user info to mongo
      const newUser = { uid: user.uid, lastOperTime: user.lastOperTime, LCOperTime: new Date().getTime(), ...user.data }
      // 这里静默处理数据同步，保持异步不影响主逻辑，不使用await
      if (newUser.uid) db.collection('low-code-user').updateOne(
        { uid: newUser.uid },
        { $set: newUser },
        { upsert: true }
      );
      next();
    } catch (e) {
      res.json(fail(e));
    }
  },
  // 挂载res[ok/fail]统一方法
  (req, res, next) => {
    res.ok = (data) => res.json(ok(data));
    res.fail = (err) => res.json(fail(err));
    next();
  },
  // 挂载错误处理中间件
  // eslint-disable-next-line no-unused-vars
  (err, req, res, next) => {
    res.fail(err);
  }
]

// ========== Gateway 网关==========
CtlGateway.use(...routerMiddlewares);
// 挂载LC路由, 要与父目录名一致
CtlGateway.use('/LC', router);

// ========== Routes 业务层路由==========
router.use('/permission', require('./permission.js'));
router.use('/lowCode', require('./lowCode.js'));
router.use('/template', require('./pageTemplates.js'));
router.use('/page', require('./pages.js'));
router.use('/datasource', require('./datasource.js'));

module.exports = CtlGateway;
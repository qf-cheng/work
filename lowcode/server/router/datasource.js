const router = require('express').Router();

router.post('/create', async (req, res, next) => {
  try {
    // const { ctx } = req;
    // const { datasource } = req.body;
  } catch (err) {
    next(err);
  }
});


module.exports = router;

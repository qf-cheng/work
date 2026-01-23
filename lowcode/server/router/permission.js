const router = require('express').Router();


router.get('/userList', async (req, res) => {
  try {
    // const userList = await db.collection('user').find({}).toArray();
    // res.ok(userList);
  } catch (e) {
    res.fail(e);  
  }
});

module.exports = router;
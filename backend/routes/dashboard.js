const express = require('express');
const router = express.Router();

router.get('/stats', (req, res) => {
  res.json({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenue: 0
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();

// Route de sante de l'API
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BYGAGOOS INK API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;

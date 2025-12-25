const express = require('express');
const router = express.Router();

// Route de santé
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Tia Faniry API',
    version: '1.0.0'
  });
});

// Route d'information
router.get('/info', (req, res) => {
  res.json({
    name: 'Tia Faniry API',
    description: 'API pour la gestion de Tia Faniry',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  });
});

module.exports = router;
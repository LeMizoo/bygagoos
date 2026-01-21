const express = require('express');
const router = express.Router();

// GET all consumables
router.get('/', (req, res) => {
  res.json({
    message: 'Consumables endpoint',
    consumables: []
  });
});

// GET single consumable
router.get('/:id', (req, res) => {
  res.json({
    message: 'Get consumable',
    id: req.params.id
  });
});

// POST create consumable
router.post('/', (req, res) => {
  res.json({
    message: 'Create consumable',
    data: req.body
  });
});

// PATCH update consumable
router.patch('/:id', (req, res) => {
  res.json({
    message: 'Update consumable',
    id: req.params.id,
    data: req.body
  });
});

// DELETE consumable
router.delete('/:id', (req, res) => {
  res.json({
    message: 'Delete consumable',
    id: req.params.id
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();

router.post('/image', (req, res) => {
  res.json({ message: 'Upload endpoint', url: '/uploads/demo.jpg' });
});

module.exports = router;

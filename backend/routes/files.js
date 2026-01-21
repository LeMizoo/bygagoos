const express = require('express');
const router = express.Router();

// Route pour la gestion des fichiers
router.get('/', (req, res) => {
  res.json({
    message: 'API Files - BYGAGOOS INK',
    endpoints: {
      upload: 'POST /api/files/upload',
      list: 'GET /api/files/list',
      get: 'GET /api/files/:id',
      delete: 'DELETE /api/files/:id'
    }
  });
});

// Route pour lister les fichiers
router.get('/list', (req, res) => {
  const files = [
    {
      id: 1,
      name: 'logo-client-abc.png',
      type: 'image/png',
      size: '245 KB',
      uploadedAt: '2024-01-15',
      uploadedBy: 'admin'
    },
    {
      id: 2,
      name: 'design-sweats.psd',
      type: 'application/psd',
      size: '15.2 MB',
      uploadedAt: '2024-01-14',
      uploadedBy: 'client-2'
    },
    {
      id: 3,
      name: 'facture-1001.pdf',
      type: 'application/pdf',
      size: '850 KB',
      uploadedAt: '2024-01-13',
      uploadedBy: 'system'
    },
    {
      id: 4,
      name: 'photos-production.jpg',
      type: 'image/jpeg',
      size: '3.2 MB',
      uploadedAt: '2024-01-12',
      uploadedBy: 'production'
    }
  ];

  res.json({
    success: true,
    data: files,
    total: files.length
  });
});

module.exports = router;

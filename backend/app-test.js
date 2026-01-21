const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de sant√© simple
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: 'SQLite (Prisma)',
    timestamp: new Date().toISOString()
  });
});

// Route auth temporaire
app.get('/api/auth/verify-token', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Token manquant - Veuillez vous connecter'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API ByGagoos Ink',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*'
    }
  });
});

// D√©marrer le serveur
app.listen(PORT, () => {
  console.log(`‚úÖ Serveur d√©marr√© sur le port ${PORT}`);
  console.log(`Ì≥Å Base de donn√©es: SQLite`);
  console.log(`Ìºê URL: http://localhost:${PORT}`);
  console.log(`Ìø• Sant√©: http://localhost:${PORT}/api/health`);
});

module.exports = app;

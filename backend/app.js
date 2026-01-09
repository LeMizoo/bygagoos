// backend/app.js
require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'API ByGagoos Ink - Backend',
    version: '1.0.0',
    status: '✅ En ligne',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        me: 'GET /api/auth/me'
      },
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  });
});

const users = [
  {
    id: 'admin-1',
    email: 'admin@bygagoos.mg',
    password: 'Admin123!',
    name: 'Admin ByGagoos',
    role: 'admin',
    phone: '+261 34 43 593 30',
    createdAt: new Date()
  },
  {
    id: 'client-1',
    email: 'client@demo.mg',
    password: 'Client123!',
    name: 'Client Démo',
    role: 'client',
    phone: '+261 34 12 345 67',
    company: 'Boutique Démo',
    businessType: 'boutique',
    createdAt: new Date()
  }
];

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email et mot de passe requis' 
      });
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Email ou mot de passe incorrect' 
      });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false,
        error: 'Email ou mot de passe incorrect' 
      });
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'bygagoos-dev-secret-key-2025',
      { expiresIn: '7d' }
    );
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      company: user.company,
      businessType: user.businessType,
      createdAt: user.createdAt
    };
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Token manquant' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'bygagoos-dev-secret-key-2025'
    );
    
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      company: user.company,
      businessType: user.businessType,
      createdAt: user.createdAt
    };
    
    res.json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expiré' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token invalide' 
      });
    }
    res.status(401).json({ 
      success: false,
      error: 'Accès non autorisé' 
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({
      success: false,
      status: 'not_authenticated'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'bygagoos-dev-secret-key-2025'
    );
    
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      company: user.company,
      businessType: user.businessType
    };
    
    res.json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Token invalide' 
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route non trouvée'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
🚀 ========================================
🚀 Serveur ByGagoos Ink DÉMARRÉ !
🚀 ========================================
📡 URL: http://localhost:${PORT}
🔌 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
🔐 Auth: POST http://localhost:${PORT}/api/auth/login
🏥 Health: http://localhost:${PORT}/health
🔧 Mode: ${process.env.NODE_ENV || 'development'}
🚀 ========================================

🔑 Identifiants:
   • Admin: admin@bygagoos.mg / Admin123!
   • Client: client@demo.mg / Client123!

✅ Prêt à recevoir des requêtes...
`);
});
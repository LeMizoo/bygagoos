const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuration CORS - ORIGINES AUTORISÉES TEMPORAIREMENT FORCÉES
const allowedOrigins = [
  'https://bygagoos-ink.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// Configuration CORS détaillée
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme les apps mobiles, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked for origin: ${origin}`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(null, true); // TEMPORAIREMENT: Accepter toutes les origines
      // Pour production sécurisée : callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization', 'Set-Cookie', 'Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 heures
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Appliquer CORS avant tous les autres middlewares
app.use(cors(corsOptions));

// Gérer explicitement les requêtes OPTIONS pour toutes les routes
app.options('*', cors(corsOptions));

// Configuration Helmet avec ajustements pour CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://bygagoos-api.vercel.app"]
    }
  }
}));

// Désactiver X-Powered-By pour plus de sécurité
app.disable('x-powered-by');

// Middleware pour parser le JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware pour logs des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Middleware pour gérer les requêtes OPTIONS globalement
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).send();
  }
  next();
});

// Servir les fichiers publics
app.use('/public', express.static(path.join(__dirname, 'public')));

// ==================== ROUTES HEALTH ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'bygagoos-api',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: '1.0.0',
    cors: {
      allowedOrigins: allowedOrigins,
      credentials: true,
      currentOrigin: req.headers.origin || 'none'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin || 'none'
    }
  });
});

// ==================== ROUTES AUTH ====================
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);
app.use('/auth', authRouter); // Support pour les deux formats

// ==================== ROUTES UTILISATEURS ====================
try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
} catch (err) {
  console.log('ℹ️ Routes utilisateurs non disponibles:', err.message);
}

// ==================== ROUTES PRODUITS ====================
try {
  const productRoutes = require('./routes/products');
  app.use('/api/products', productRoutes);
} catch (err) {
  console.log('ℹ️ Routes produits non disponibles:', err.message);
}

// ==================== ROUTES COMMANDES ====================
try {
  const orderRoutes = require('./routes/orders');
  app.use('/api/orders', orderRoutes);
} catch (err) {
  console.log('ℹ️ Routes commandes non disponibles:', err.message);
}

// ==================== ROUTES CLIENTS ====================
try {
  const clientRoutes = require('./routes/clients');
  app.use('/api/clients', clientRoutes);
} catch (err) {
  console.log('ℹ️ Routes clients non disponibles:', err.message);
}

// ==================== ROUTES STOCK ====================
try {
  const stockRoutes = require('./routes/stock');
  app.use('/api/stock', stockRoutes);
} catch (err) {
  console.log('ℹ️ Routes stock non disponibles:', err.message);
}

// ==================== ROUTES PRODUCTION ====================
try {
  const productionRoutes = require('./routes/production');
  app.use('/api/production', productionRoutes);
} catch (err) {
  console.log('ℹ️ Routes production non disponibles:', err.message);
}

// ==================== ROUTES CONSOMMABLES ====================
try {
  const consumableRoutes = require('./routes/consumables');
  app.use('/api/consumables', consumableRoutes);
} catch (err) {
  console.log('ℹ️ Routes consommables non disponibles:', err.message);
}

// ==================== ROUTES FICHIERS ====================
try {
  const fileRoutes = require('./routes/files');
  app.use('/api/files', fileRoutes);
} catch (err) {
  console.log('ℹ️ Routes fichiers non disponibles:', err.message);
}

// ==================== TEST ENDPOINTS ====================
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']
    }
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working (no /api prefix)',
    timestamp: new Date().toISOString()
  });
});

// ==================== ROUTE RACINE ====================
app.get('/', (req, res) => {
  res.json({
    message: 'ByGagoos Ink API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: allowedOrigins,
      credentials: true
    },
    endpoints: {
      auth: ['POST /api/auth/login', 'POST /auth/login'],
      health: ['GET /api/health', 'GET /health'],
      test: ['GET /api/test', 'GET /test'],
      users: ['GET /api/users'],
      products: ['GET /api/products'],
      orders: ['GET /api/orders'],
      clients: ['GET /api/clients'],
      stock: ['GET /api/stock'],
      production: ['GET /api/production'],
      files: ['GET /api/files']
    }
  });
});

// ==================== ROUTE 404 ====================
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/auth/login',
      '/auth/login',
      '/api/health',
      '/health',
      '/api/test',
      '/test',
      '/api/users',
      '/api/products',
      '/api/orders',
      '/api/clients',
      '/api/stock',
      '/api/production',
      '/api/files'
    ],
    cors: {
      currentOrigin: req.headers.origin,
      allowedOrigins: allowedOrigins
    }
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    origin: req.headers.origin
  });
  
  // Gérer les erreurs CORS spécifiquement
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: `Origin '${req.headers.origin}' not allowed`,
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    path: req.originalUrl,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== DÉMARRAGE ====================
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, () => {
  console.log(`
    🚀 ByGagoos Ink Backend démarré !
    🚀 Port: ${PORT}
    🚀 URL: http://localhost:${PORT}
    🚀 Environnement: ${process.env.NODE_ENV || 'development'}
    🚀 CORS Origins: ${allowedOrigins.join(', ')}
    🚀 Date: ${new Date().toLocaleString()}
    🚀 Mode: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
  `);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
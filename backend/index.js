const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// =========================
// CONFIGURATION
// =========================
const JWT_SECRET = process.env.JWT_SECRET || 'bygagoos-production-secret-2024';
const IS_VERCEL = process.env.VERCEL === '1';

console.log(`🚀 ByGagoos API starting...`);
console.log(`🟢 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`⚡ Vercel: ${IS_VERCEL ? 'YES' : 'NO'}`);

// =========================
// MIDDLEWARE
// =========================
app.use(cors({
  origin: ['https://bygagoos-ink.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// =========================
// HEALTH ENDPOINTS
// =========================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ByGagoos API',
    mode: IS_VERCEL ? 'vercel' : 'local',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'API healthy',
    mode: IS_VERCEL ? 'vercel' : 'local'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'ByGagoos Ink API',
    version: '1.0.0',
    status: 'operational',
    auth: 'POST /auth/login',
    mode: IS_VERCEL ? 'vercel-production' : 'local-development'
  });
});

// =========================
// AUTHENTICATION
// =========================
const users = [
  { id: 'admin-001', email: 'admin@bygagoos.mg', password: 'admin123', name: 'Administrateur', role: 'admin' },
  { id: 'user-001', email: 'user@bygagoos.mg', password: 'user123', name: 'Utilisateur', role: 'user' }
];

const loginHandler = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });

  const user = users.find(u => u.email === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userWithoutPassword } = user;

  res.json({ success: true, token, user: userWithoutPassword });
};

// =========================
// ROUTES
// =========================
app.post('/auth/login', loginHandler);
app.post('/api/auth/login', loginHandler);

app.get('/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token manquant' });
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
});

// =========================
// 404 & ERROR HANDLER
// =========================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} non trouvée` });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
});

// =========================
// EXPORT & LOCAL START
// =========================
module.exports = app;

if (!IS_VERCEL && require.main === module) {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

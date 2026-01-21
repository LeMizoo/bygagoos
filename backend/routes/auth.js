// backend/routes/auth.js - VERSION FINALE
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// =========================
// MIDDLEWARE JWT
// =========================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ 
    success: false,
    message: 'Token manquant' 
  });

  jwt.verify(token, process.env.JWT_SECRET || 'bygagoos-secret-key-2024', (err, user) => {
    if (err) return res.status(403).json({ 
      success: false,
      message: 'Token invalide' 
    });
    req.user = user;
    next();
  });
};

// =========================
// LOGIN (déjà géré par app.js, mais gardé pour compatibilité)
// =========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`🔐 Route /api/auth/login appelée: ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email et mot de passe requis' 
      });
    }

    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'bygagoos-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: err.message 
    });
  }
});

// =========================
// GET CURRENT USER
// =========================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur introuvable' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Profile error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: err.message 
    });
  }
});

// =========================
// LOGOUT
// =========================
router.post('/logout', (req, res) => {
  res.json({ 
    success: true,
    message: 'Déconnexion effectuée' 
  });
});

// =========================
// VERIFY TOKEN
// =========================
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token valide',
    user: req.user
  });
});

module.exports = router;
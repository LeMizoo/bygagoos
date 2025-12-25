const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Données fixes des 4 membres (mode demo)
const demoUsers = [
  {
    id: 1,
    email: 'tovoniaina.rahendrison@gmail.com',
    // Mot de passe "changeme" hashé au démarrage
    password: bcrypt.hashSync(process.env.DEFAULT_PASSWORD || 'changeme', 10),
    firstName: 'Tovoniaina',
    lastName: 'RAHENDRISON',
    role: 'SUPER_ADMIN',
    familyRole: 'STRUCTURE'
  },
  {
    id: 2,
    email: 'dedettenadia@gmail.com',
    password: bcrypt.hashSync(process.env.DEFAULT_PASSWORD || 'changeme', 10),
    firstName: 'Volatiana',
    lastName: 'RANDRIANARISOA',
    role: 'ADMIN',
    familyRole: 'INSPIRATION_CREATIVITY'
  },
  {
    id: 3,
    email: 'miantsatianarahendrison@gmail.com',
    password: bcrypt.hashSync(process.env.DEFAULT_PASSWORD || 'changeme', 10),
    firstName: 'Miantsatiana',
    lastName: 'RAHENDRISON',
    role: 'ADMIN',
    familyRole: 'OPERATIONS_DESIGN'
  },
  {
    id: 4,
    email: 'fanirytia17@gmail.com',
    password: bcrypt.hashSync(process.env.DEFAULT_PASSWORD || 'changeme', 10),
    firstName: 'Tia Faniry',
    lastName: 'RAHENDRISON',
    role: 'ADMIN',
    familyRole: 'ADMIN_COMMUNICATION'
  }
];

// Route de login (demo)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = demoUsers.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Email incorrect' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'bygagoos-secret-key',
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      familyRole: user.familyRole
    }
  });
});

// Route "me" (profil utilisateur - demo)
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bygagoos-secret-key');
    const user = demoUsers.find(u => u.email === decoded.email);
    if (!user) return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        familyRole: user.familyRole
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
});

module.exports = router;

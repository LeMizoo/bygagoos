const express = require('express');
const router = express.Router();

// Donnees mockees pour les utilisateurs
const users = [
  {
    id: 1,
    email: "admin@bygagoos.mg",
    role: "admin",
    name: "Administrateur System",
    avatar: "/profiles/admin.jpg",
    status: "active",
    lastLogin: "2024-01-14T10:30:00Z"
  },
  {
    id: 2,
    email: "client@bygagoos.mg",
    role: "client",
    name: "Client Test",
    avatar: "/profiles/client.jpg",
    status: "active",
    lastLogin: "2024-01-14T09:15:00Z"
  },
  {
    id: 3,
    email: "production@bygagoos.mg",
    role: "production",
    name: "Responsable Production",
    avatar: "/profiles/production.jpg",
    status: "active",
    lastLogin: "2024-01-14T08:45:00Z"
  },
  {
    id: 4,
    email: "designer@bygagoos.mg",
    role: "designer",
    name: "Designer Graphique",
    avatar: "/profiles/designer.jpg",
    status: "inactive",
    lastLogin: "2024-01-13T16:20:00Z"
  }
];

// Recuperer tous les utilisateurs
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status,
      lastLogin: user.lastLogin
    }))
  });
});

// Recuperer un utilisateur par ID
router.get('/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouve'
    });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status,
      lastLogin: user.lastLogin
    }
  });
});

// Mettre a jour un utilisateur
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const updates = req.body;

  res.json({
    success: true,
    message: 'Utilisateur mis a jour',
    data: {
      id: userId,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Statistiques utilisateurs
router.get('/stats/summary', (req, res) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const userRoles = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      userRoles,
      lastUpdated: new Date().toISOString()
    }
  });
});

module.exports = router;

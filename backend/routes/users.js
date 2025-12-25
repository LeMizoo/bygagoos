const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Obtenir tous les utilisateurs (admin seulement)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const users = await User.getAllFamilyMembers();
    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un utilisateur spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'SUPER_ADMIN' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil utilisateur
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Vérifier les permissions
    if (req.user.role !== 'SUPER_ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const updatedUser = await User.updateProfile(userId, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le mot de passe
router.post('/:id/change-password', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;

    // Vérifier les permissions
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer l'utilisateur
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isValidPassword = await User.verifyPassword(user, currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Changer le mot de passe
    await User.changePassword(userId, newPassword);
    
    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les statistiques utilisateurs (admin seulement)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const stats = await User.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

const prisma = require('../services/prisma');

const userController = {
  // Récupérer tous les utilisateurs
  getAllUsers: async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });
      
      res.json({
        success: true,
        count: users.length,
        users
      });
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },
  
  // Récupérer un utilisateur par ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },
  
  // Mettre à jour un utilisateur
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;
      
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name,
          email,
          role
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
      
      res.json({
        success: true,
        message: 'Utilisateur mis à jour',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },
  
  // Supprimer un utilisateur
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      await prisma.user.delete({
        where: { id }
      });
      
      res.json({
        success: true,
        message: 'Utilisateur supprimé'
      });
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
};

module.exports = userController;

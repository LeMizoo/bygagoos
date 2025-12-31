// backend/controllers/authController.js
const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Chercher l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Email ou mot de passe incorrect' }
        });
      }
      
      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: { message: 'Ce compte est désactivé. Contactez un administrateur.' }
        });
      }
      
      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: { message: 'Email ou mot de passe incorrect' }
        });
      }
      
      // Mettre à jour la dernière connexion
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
      
      // Générer les tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        familyRole: user.familyRole,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'bygagoos-secret-key-prod-2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || 'bygagoos-refresh-secret-prod-2024',
        { expiresIn: '7d' }
      );
      
      // Stocker le refresh token dans la base
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });
      
      // Log d'activité
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          details: { method: 'email_password' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      // Ne pas envoyer le mot de passe dans la réponse
      const { password: userPassword, refreshToken: storedToken, ...userWithoutSensitive } = user;
      
      logger.info(`User ${user.email} logged in`);
      
      res.json({
        success: true,
        message: 'Connexion réussie',
        accessToken,
        refreshToken,
        user: userWithoutSensitive,
        mustChangePassword: user.mustChangePassword
      });
      
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  register: async (req, res) => {
    try {
      // Cette fonction est déjà dans routes/auth.js
      // Tu peux copier la logique de routes/auth.js ici si besoin
      res.status(501).json({
        success: false,
        message: 'Non implémenté - Utilise la route /api/auth/register'
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },
  
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requis'
        });
      }
      
      // Vérifier le refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'bygagoos-refresh-secret-prod-2024'
      );
      
      // Vérifier si l'utilisateur existe et a le bon refresh token
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token invalide'
        });
      }
      
      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Compte désactivé'
        });
      }
      
      // Générer un nouveau access token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        familyRole: user.familyRole,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      const newAccessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'bygagoos-secret-key-prod-2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      logger.info(`Token refreshed for user ${user.email}`);
      
      res.json({
        success: true,
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          familyRole: user.familyRole,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        }
      });
      
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token invalide'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expiré'
        });
      }
      
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rafraîchissement du token'
      });
    }
  },
  
  getProfile: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          familyRole: true,
          avatar: true,
          isActive: true,
          mustChangePassword: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
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
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  },
  
  logout: async (req, res) => {
    try {
      // Supprimer le refresh token
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });
      
      // Log d'activité
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'USER_LOGOUT',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      logger.info(`User ${req.user.email} logged out`);
      
      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
      
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion'
      });
    }
  },
  
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      // Vérifier le mot de passe actuel
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Mettre à jour
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
          updatedAt: new Date()
        }
      });
      
      // Log d'activité
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_CHANGED',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      logger.info(`User ${user.email} changed password`);
      
      res.json({
        success: true,
        message: 'Mot de passe changé avec succès'
      });
      
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de mot de passe'
      });
    }
  }
};

module.exports = authController;
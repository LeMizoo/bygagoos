const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Token manquant.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Chercher l'utilisateur
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Compte désactivé. Contactez l\'administrateur.' 
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.token = token;
    
    logger.info(`Authentification réussie - User: ${user.email}, Role: ${user.role}`);
    next();
  } catch (error) {
    logger.error(`Erreur d'authentification: ${error.message}`);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expiré. Veuillez vous reconnecter.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur d\'authentification.' 
    });
  }
};

// Middleware de rôles
const roleAuth = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non authentifié.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Tentative d'accès non autorisé - User: ${req.user.email}, Role: ${req.user.role}, Required: ${roles}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Accès interdit. Droits insuffisants.' 
      });
    }

    next();
  };
};

// Middleware pour propriétaire ou admin
const ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Non authentifié.' 
    });
  }

  // Admins peuvent tout faire
  if (req.user.role === 'admin') {
    return next();
  }

  // Vérifier si l'utilisateur est le propriétaire
  const resourceId = req.params.id || req.body.userId;
  
  if (req.user._id.toString() !== resourceId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Vous ne pouvez modifier que vos propres données.' 
    });
  }

  next();
};

module.exports = { auth, roleAuth, ownerOrAdmin };
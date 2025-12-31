const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

const auth = {
  // Hasher un mot de passe
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },
  
  // Vérifier un mot de passe
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },
  
  // Générer un token JWT
  generateToken: (userId, role, expiresIn = '24h') => {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn }
    );
  },
  
  // Générer un refresh token
  generateRefreshToken: (userId) => {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  },
  
  // Vérifier un token JWT
  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      return null;
    }
  },
  
  // Vérifier un refresh token
  verifyRefreshToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      logger.error('Refresh token verification failed:', error.message);
      return null;
    }
  },
  
  // Middleware d'authentification
  authenticate: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }
    
    const decoded = auth.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token.' }
      });
    }
    
    req.user = decoded;
    next();
  },
  
  // Middleware d'autorisation par rôle
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' }
        });
      }
      
      if (!roles.includes(req.user.role)) {
        logger.warn(`Unauthorized access attempt by user ${req.user.userId} with role ${req.user.role}`);
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied. Insufficient permissions.' }
        });
      }
      
      next();
    };
  }
};

module.exports = auth;

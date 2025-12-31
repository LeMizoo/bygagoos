const { validationResult } = require('express-validator');
const logger = require('./logger');

const validation = {
  // Middleware pour valider les requêtes
  validateRequest: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation error', { 
        errors: errors.array(),
        path: req.path,
        body: req.body 
      });
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }
    next();
  },
  
  // Fonctions de validation réutilisables
  isEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  isPhone: (phone) => {
    const regex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,3}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    return regex.test(phone);
  },
  
  isObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  
  sanitizeInput: (input) => {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    return input;
  }
};

module.exports = validation;

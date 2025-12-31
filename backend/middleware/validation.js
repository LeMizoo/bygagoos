// backend/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');
const prisma = require('../prisma/client');
const validator = require('validator');
const logger = require('../utils/logger');

/**
 * Middleware de validation des résultats
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
      location: err.location
    }));
    
    logger.warn('Validation failed', {
      errors: formattedErrors,
      path: req.path,
      method: req.method
    });
    
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Validation pour l'authentification
 */
const authValidation = {
  register: [
    body('email')
      .trim()
      .notEmpty().withMessage('L\'email est requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail()
      .custom(async (email) => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) throw new Error('Email déjà utilisé');
        return true;
      }),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Le mot de passe est requis')
      .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    
    body('firstName')
      .trim()
      .notEmpty().withMessage('Le prénom est requis')
      .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
    
    body('lastName')
      .trim()
      .notEmpty().withMessage('Le nom est requis')
      .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    
    body('role')
      .optional()
      .isIn(['FAMILY_MEMBER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']).withMessage('Rôle invalide'),
    
    body('phone')
      .trim()
      .optional()
      .custom((value) => {
        if (value && !validator.isMobilePhone(value, 'any', { strictMode: false })) {
          throw new Error('Numéro de téléphone invalide');
        }
        return true;
      }),
    
    validate
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('L\'email est requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Le mot de passe est requis'),
    
    validate
  ],
  
  resetPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('L\'email est requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),
    
    validate
  ],
  
  changePassword: [
    body('currentPassword')
      .trim()
      .notEmpty().withMessage('Le mot de passe actuel est requis'),
    
    body('newPassword')
      .trim()
      .notEmpty().withMessage('Le nouveau mot de passe est requis')
      .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
        }
        return true;
      }),
    
    body('confirmPassword')
      .trim()
      .notEmpty().withMessage('La confirmation du mot de passe est requise')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Les mots de passe ne correspondent pas');
        }
        return true;
      }),
    
    validate
  ]
};

/**
 * Validation pour les clients
 */
const clientValidation = {
  create: [
    body('companyName')
      .trim()
      .notEmpty().withMessage('Le nom de l\'entreprise est requis')
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    
    body('contactName')
      .trim()
      .notEmpty().withMessage('Le nom du contact est requis')
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('L\'email est requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail()
      .custom(async (email) => {
        const client = await prisma.client.findUnique({ where: { email } });
        if (client) throw new Error('Un client avec cet email existe déjà');
        return true;
      }),
    
    body('phone')
      .trim()
      .notEmpty().withMessage('Le téléphone est requis')
      .custom((value) => {
        if (!validator.isMobilePhone(value, 'any', { strictMode: false })) {
          throw new Error('Numéro de téléphone invalide');
        }
        return true;
      }),
    
    body('address')
      .trim()
      .optional()
      .isLength({ max: 255 }).withMessage('L\'adresse ne peut pas dépasser 255 caractères'),
    
    body('taxNumber')
      .trim()
      .optional(),
    
    body('notes')
      .trim()
      .optional()
      .isLength({ max: 1000 }).withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
    
    validate
  ],
  
  update: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID invalide')
      .toInt(),
    
    body('companyName')
      .trim()
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    
    body('contactName')
      .trim()
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    
    body('email')
      .trim()
      .optional()
      .isEmail().withMessage('Email invalide')
      .normalizeEmail()
      .custom(async (email, { req }) => {
        if (email) {
          const client = await prisma.client.findUnique({ where: { email } });
          if (client && client.id !== parseInt(req.params.id)) {
            throw new Error('Un client avec cet email existe déjà');
          }
        }
        return true;
      }),
    
    body('phone')
      .trim()
      .optional()
      .custom((value) => {
        if (value && !validator.isMobilePhone(value, 'any', { strictMode: false })) {
          throw new Error('Numéro de téléphone invalide');
        }
        return true;
      }),
    
    body('address')
      .trim()
      .optional()
      .isLength({ max: 255 }).withMessage('L\'adresse ne peut pas dépasser 255 caractères'),
    
    validate
  ]
};

/**
 * Validation pour les commandes
 */
const orderValidation = {
  create: [
    body('clientId')
      .notEmpty().withMessage('L\'ID du client est requis')
      .isInt().withMessage('L\'ID du client doit être un nombre')
      .custom(async (clientId) => {
        const client = await prisma.client.findUnique({ where: { id: parseInt(clientId) } });
        if (!client) throw new Error('Client non trouvé');
        return true;
      }),
    
    body('items')
      .isArray({ min: 1 }).withMessage('Au moins un article est requis')
      .custom((items) => {
        if (!Array.isArray(items)) {
          throw new Error('Les articles doivent être dans un tableau');
        }
        
        items.forEach((item, index) => {
          if (!item.productId) {
            throw new Error(`L'article ${index + 1} doit avoir un productId`);
          }
          if (!item.quantity || item.quantity < 1) {
            throw new Error(`L'article ${index + 1} doit avoir une quantité valide`);
          }
          if (item.quantity > 10000) {
            throw new Error(`La quantité de l'article ${index + 1} ne peut pas dépasser 10000`);
          }
        });
        
        return true;
      }),
    
    body('deliveryDate')
      .notEmpty().withMessage('La date de livraison est requise')
      .isISO8601().withMessage('Format de date invalide (YYYY-MM-DD)')
      .custom((date) => {
        const deliveryDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deliveryDate < today) {
          throw new Error('La date de livraison ne peut pas être dans le passé');
        }
        
        // Limite à 1 an
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        
        if (deliveryDate > maxDate) {
          throw new Error('La date de livraison ne peut pas dépasser 1 an');
        }
        
        return true;
      }),
    
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Priorité invalide'),
    
    body('notes')
      .trim()
      .optional()
      .isLength({ max: 2000 }).withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
    
    validate
  ],
  
  update: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID invalide')
      .toInt(),
    
    body('status')
      .optional()
      .isIn(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']).withMessage('Statut invalide'),
    
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Priorité invalide'),
    
    body('deliveryDate')
      .optional()
      .isISO8601().withMessage('Format de date invalide (YYYY-MM-DD)'),
    
    validate
  ]
};

/**
 * Validation pour les produits
 */
const productValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Le nom du produit est requis')
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    
    body('category')
      .trim()
      .notEmpty().withMessage('La catégorie est requise')
      .isIn(['TSHIRT', 'SWEATSHIRT', 'HOODIE', 'PULL', 'PANTALON', 'ACCESSORY', 'OTHER']).withMessage('Catégorie invalide'),
    
    body('price')
      .notEmpty().withMessage('Le prix est requis')
      .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif')
      .custom((price) => {
        if (price > 1000000) {
          throw new Error('Le prix ne peut pas dépasser 1 000 000');
        }
        return true;
      }),
    
    body('cost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Le coût doit être un nombre positif'),
    
    body('description')
      .trim()
      .optional()
      .isLength({ max: 1000 }).withMessage('La description ne peut pas dépasser 1000 caractères'),
    
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 }).withMessage('La quantité en stock doit être un nombre entier positif'),
    
    body('minStock')
      .optional()
      .isInt({ min: 0 }).withMessage('Le stock minimum doit être un nombre entier positif'),
    
    body('colors')
      .optional()
      .isArray().withMessage('Les couleurs doivent être dans un tableau'),
    
    body('sizes')
      .optional()
      .isArray().withMessage('Les tailles doivent être dans un tableau'),
    
    validate
  ]
};

/**
 * Validation pour le stock
 */
const stockValidation = {
  createConsumable: [
    body('name')
      .trim()
      .notEmpty().withMessage('Le nom est requis')
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    
    body('category')
      .trim()
      .notEmpty().withMessage('La catégorie est requise')
      .isIn(['INK', 'FABRIC', 'MATERIAL', 'PACKAGING', 'OTHER']).withMessage('Catégorie invalide'),
    
    body('quantity')
      .notEmpty().withMessage('La quantité est requise')
      .isFloat({ min: 0 }).withMessage('La quantité doit être un nombre positif'),
    
    body('unit')
      .trim()
      .notEmpty().withMessage('L\'unité est requise')
      .isIn(['LITER', 'KILOGRAM', 'METER', 'UNIT', 'ROLL', 'PACK']).withMessage('Unité invalide'),
    
    body('minQuantity')
      .optional()
      .isFloat({ min: 0 }).withMessage('La quantité minimum doit être un nombre positif'),
    
    body('location')
      .trim()
      .optional()
      .isLength({ max: 100 }).withMessage('L\'emplacement ne peut pas dépasser 100 caractères'),
    
    validate
  ],
  
  updateConsumable: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID invalide')
      .toInt(),
    
    body('name')
      .trim()
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    
    body('category')
      .trim()
      .optional()
      .isIn(['INK', 'FABRIC', 'MATERIAL', 'PACKAGING', 'OTHER']).withMessage('Catégorie invalide'),
    
    body('quantity')
      .optional()
      .isFloat({ min: 0 }).withMessage('La quantité doit être un nombre positif'),
    
    body('unit')
      .trim()
      .optional()
      .isIn(['LITER', 'KILOGRAM', 'METER', 'UNIT', 'ROLL', 'PACK']).withMessage('Unité invalide'),
    
    body('minQuantity')
      .optional()
      .isFloat({ min: 0 }).withMessage('La quantité minimum doit être un nombre positif'),
    
    body('location')
      .trim()
      .optional()
      .isLength({ max: 100 }).withMessage('L\'emplacement ne peut pas dépasser 100 caractères'),
    
    validate
  ]
};

/**
 * Validation pour les paramètres d'URL
 */
const paramValidation = {
  id: [
    param('id')
      .isInt({ min: 1 }).withMessage('L\'ID doit être un nombre positif')
      .toInt(),
    validate
  ],
  
  clientId: [
    param('clientId')
      .isInt({ min: 1 }).withMessage('L\'ID du client doit être un nombre positif')
      .toInt(),
    validate
  ],
  
  orderId: [
    param('orderId')
      .isInt({ min: 1 }).withMessage('L\'ID de commande doit être un nombre positif')
      .toInt(),
    validate
  ],
  
  productId: [
    param('productId')
      .isInt({ min: 1 }).withMessage('L\'ID du produit doit être un nombre positif')
      .toInt(),
    validate
  ]
};

/**
 * Validation pour les paramètres de recherche
 */
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('La page doit être un nombre positif')
      .toInt()
      .customSanitizer(value => value || 1),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100')
      .toInt()
      .customSanitizer(value => value || 20),
    
    query('sortBy')
      .optional()
      .isString().withMessage('Le champ de tri doit être une chaîne'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc']).withMessage('L\'ordre de tri doit être asc ou desc')
      .customSanitizer(value => value || 'desc'),
    
    validate
  ],
  
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601().withMessage('Format de date de début invalide'),
    
    query('endDate')
      .optional()
      .isISO8601().withMessage('Format de date de fin invalide')
      .custom((endDate, { req }) => {
        if (req.query.startDate && endDate) {
          const start = new Date(req.query.startDate);
          const end = new Date(endDate);
          if (end < start) {
            throw new Error('La date de fin ne peut pas être avant la date de début');
          }
        }
        return true;
      }),
    
    validate
  ],
  
  search: [
    query('search')
      .optional()
      .isString().withMessage('Le terme de recherche doit être une chaîne')
      .trim()
      .escape(),
    
    validate
  ],
  
  status: [
    query('status')
      .optional()
      .isString().withMessage('Le statut doit être une chaîne')
      .trim()
      .escape(),
    
    validate
  ]
};

/**
 * Validation personnalisée pour les URLs
 */
const isUrl = (value) => {
  if (!value) return true;
  return validator.isURL(value, { 
    protocols: ['http', 'https'],
    require_protocol: false 
  });
};

/**
 * Validation personnalisée pour les téléphones
 */
const isPhone = (value) => {
  if (!value) return true;
  return validator.isMobilePhone(value, 'any', { strictMode: false });
};

/**
 * Validation personnalisée pour les emails
 */
const isEmail = (value) => {
  if (!value) return true;
  return validator.isEmail(value);
};

/**
 * Validation pour les fichiers uploadés
 */
const validateFile = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, errors: ['Aucun fichier fourni'] };
  }
  
  const errors = [];
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux. Taille max: ${maxSize / 1024 / 1024} MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Middleware pour valider les IDs
 */
const validateId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }
  
  req.params.id = parseInt(id);
  next();
};

/**
 * Middleware pour sanitizer les entrées
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  next();
};

module.exports = {
  validate,
  validateId,
  sanitizeInput,
  authValidation,
  clientValidation,
  orderValidation,
  productValidation,
  stockValidation,
  paramValidation,
  queryValidation,
  isUrl,
  isPhone,
  isEmail,
  validateFile
};
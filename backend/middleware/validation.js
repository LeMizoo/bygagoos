const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware de validation générique
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    logger.warn(`Validation échouée: ${JSON.stringify(errorMessages)}`);

    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errorMessages
    });
  };
};

// Validation authentification
const validateAuth = {
  login: validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Mot de passe requis')
      .isLength({ min: 6 }).withMessage('Minimum 6 caractères')
  ]),

  register: validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Mot de passe requis')
      .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Doit contenir majuscule, minuscule et chiffre'),
    
    body('firstName')
      .trim()
      .notEmpty().withMessage('Prénom requis')
      .isLength({ min: 2 }).withMessage('Minimum 2 caractères'),
    
    body('lastName')
      .trim()
      .notEmpty().withMessage('Nom requis')
      .isLength({ min: 2 }).withMessage('Minimum 2 caractères'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numéro de téléphone invalide')
  ]),

  updateProfile: validate([
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Minimum 2 caractères'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Minimum 2 caractères'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numéro de téléphone invalide'),
    
    body('currentPassword')
      .optional()
      .trim()
      .isLength({ min: 6 }).withMessage('Minimum 6 caractères'),
    
    body('newPassword')
      .optional()
      .trim()
      .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Doit contenir majuscule, minuscule et chiffre')
  ])
};

// Validation commandes
const validateOrder = {
  create: validate([
    body('clientId')
      .notEmpty().withMessage('Client requis')
      .isMongoId().withMessage('ID client invalide'),
    
    body('items')
      .isArray({ min: 1 }).withMessage('Au moins un article requis')
      .custom(items => items.every(item => 
        item.productId && 
        item.quantity && 
        item.unitPrice
      )).withMessage('Chaque article doit avoir productId, quantity et unitPrice'),
    
    body('items.*.productId')
      .isMongoId().withMessage('ID produit invalide'),
    
    body('items.*.quantity')
      .isInt({ min: 1 }).withMessage('Quantité minimum: 1'),
    
    body('items.*.unitPrice')
      .isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
    
    body('deliveryDate')
      .optional()
      .isISO8601().withMessage('Date invalide')
      .custom(value => {
        const date = new Date(value);
        return date > new Date();
      }).withMessage('Date doit être dans le futur'),
    
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent']).withMessage('Priorité invalide'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Maximum 1000 caractères')
  ]),

  update: validate([
    param('id')
      .isMongoId().withMessage('ID commande invalide'),
    
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'])
      .withMessage('Statut invalide'),
    
    body('deposit')
      .optional()
      .isFloat({ min: 0 }).withMessage('Acompte invalide'),
    
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent']).withMessage('Priorité invalide'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Maximum 1000 caractères')
  ])
};

// Validation clients
const validateClient = {
  create: validate([
    body('contactName')
      .trim()
      .notEmpty().withMessage('Nom du contact requis')
      .isLength({ min: 2 }).withMessage('Minimum 2 caractères'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),
    
    body('phone')
      .trim()
      .notEmpty().withMessage('Téléphone requis')
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numéro invalide'),
    
    body('companyName')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Maximum 100 caractères'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Maximum 500 caractères'),
    
    body('taxId')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Maximum 50 caractères')
  ]),

  update: validate([
    param('id')
      .isMongoId().withMessage('ID client invalide'),
    
    body('contactName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Minimum 2 caractères'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numéro invalide')
  ])
};

// Validation produits
const validateProduct = {
  create: validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Nom requis')
      .isLength({ min: 2, max: 100 }).withMessage('Entre 2 et 100 caractères'),
    
    body('category')
      .trim()
      .notEmpty().withMessage('Catégorie requise')
      .isIn(['t-shirt', 'polo', 'casquette', 'sac', 'autre']).withMessage('Catégorie invalide'),
    
    body('basePrice')
      .isFloat({ min: 0 }).withMessage('Prix invalide'),
    
    body('minQuantity')
      .isInt({ min: 1 }).withMessage('Quantité minimum: 1'),
    
    body('colors')
      .optional()
      .isArray().withMessage('Doit être un tableau'),
    
    body('sizes')
      .optional()
      .isArray().withMessage('Doit être un tableau'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Maximum 500 caractères')
  ])
};

// Validation stock
const validateStock = {
  create: validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Nom requis')
      .isLength({ min: 2, max: 100 }).withMessage('Entre 2 et 100 caractères'),
    
    body('category')
      .trim()
      .notEmpty().withMessage('Catégorie requise')
      .isIn(['Encre', 'Support', 'Outillage', 'Emballage']).withMessage('Catégorie invalide'),
    
    body('quantity')
      .isInt({ min: 0 }).withMessage('Quantité invalide'),
    
    body('unit')
      .trim()
      .notEmpty().withMessage('Unité requise')
      .isIn(['Litre', 'Pièce', 'Kg', 'Rouleau', 'Boîte']).withMessage('Unité invalide'),
    
    body('minLevel')
      .isInt({ min: 0 }).withMessage('Niveau minimum invalide'),
    
    body('unitCost')
      .isFloat({ min: 0 }).withMessage('Coût unitaire invalide')
  ]),

  update: validate([
    body('quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Quantité invalide'),
    
    body('minLevel')
      .optional()
      .isInt({ min: 0 }).withMessage('Niveau minimum invalide'),
    
    body('unitCost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Coût unitaire invalide')
  ])
};

// Validation fichiers
const validateFile = {
  upload: validate([
    body('type')
      .isIn(['order', 'profile', 'document']).withMessage('Type de fichier invalide'),
    
    param('id')
      .optional()
      .isMongoId().withMessage('ID invalide')
  ])
};

// Validation requêtes avec pagination
const validatePagination = validate([
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page doit être >= 1')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit entre 1 et 100')
    .toInt(),
  
  query('sort')
    .optional()
    .isString().withMessage('Sort doit être une chaîne'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Order doit être asc ou desc')
]);

// Validation téléphone malgache
const validateMalagasyPhone = (phone) => {
  const regex = /^(\+261|0)(32|33|34|38)\d{7}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

// Middleware personnalisé pour téléphone MG
const validatePhoneMG = (field) => {
  return body(field)
    .custom(value => {
      if (!value) return true;
      return validateMalagasyPhone(value);
    })
    .withMessage('Numéro de téléphone malgache invalide. Format: +261 32 123 4567 ou 032 12 345 67');
};

// Exporter toutes les validations
module.exports = {
  validate,
  validateAuth,
  validateOrder,
  validateClient,
  validateProduct,
  validateStock,
  validateFile,
  validatePagination,
  validateMalagasyPhone,
  validatePhoneMG
};
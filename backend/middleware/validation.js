const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware de validation generique
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

    logger.warn(`Validation echouee: ${JSON.stringify(errorMessages)}`);

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
      .isLength({ min: 6 }).withMessage('Minimum 6 caracteres')
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
      .isLength({ min: 8 }).withMessage('Minimum 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Doit contenir majuscule, minuscule et chiffre'),

    body('firstName')
      .trim()
      .notEmpty().withMessage('Prenom requis')
      .isLength({ min: 2 }).withMessage('Minimum 2 caracteres'),

    body('lastName')
      .trim()
      .notEmpty().withMessage('Nom requis')
      .isLength({ min: 2 }).withMessage('Minimum 2 caracteres'),

    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numero de telephone invalide')
  ]),

  updateProfile: validate([
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Minimum 2 caracteres'),

    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Minimum 2 caracteres'),

    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numero de telephone invalide'),

    body('currentPassword')
      .optional()
      .trim()
      .isLength({ min: 6 }).withMessage('Minimum 6 caracteres'),

    body('newPassword')
      .optional()
      .trim()
      .isLength({ min: 8 }).withMessage('Minimum 8 caracteres')
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
      .isInt({ min: 1 }).withMessage('Quantite minimum: 1'),

    body('items.*.unitPrice')
      .isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),

    body('deliveryDate')
      .optional()
      .isISO8601().withMessage('Date invalide')
      .custom(value => {
        const date = new Date(value);
        return date > new Date();
      }).withMessage('Date doit etre dans le futur'),

    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent']).withMessage('Priorite invalide'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Maximum 1000 caracteres')
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
      .isIn(['low', 'normal', 'high', 'urgent']).withMessage('Priorite invalide'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Maximum 1000 caracteres')
  ])
};

// Validation clients
const validateClient = {
  create: validate([
    body('contactName')
      .trim()
      .notEmpty().withMessage('Nom du contact requis')
      .isLength({ min: 2 }).withMessage('Minimum 2 caracteres'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email requis')
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),

    body('phone')
      .trim()
      .notEmpty().withMessage('Telephone requis')
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numero invalide'),

    body('companyName')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Maximum 100 caracteres'),

    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Maximum 500 caracteres'),

    body('taxId')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Maximum 50 caracteres')
  ]),

  update: validate([
    param('id')
      .isMongoId().withMessage('ID client invalide'),

    body('contactName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Minimum 2 caracteres'),

    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Email invalide')
      .normalizeEmail(),

    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Numero invalide')
  ])
};

// Validation produits
const validateProduct = {
  create: validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Nom requis')
      .isLength({ min: 2, max: 100 }).withMessage('Entre 2 et 100 caracteres'),

    body('category')
      .trim()
      .notEmpty().withMessage('Categorie requise')
      .isIn(['t-shirt', 'polo', 'casquette', 'sac', 'autre']).withMessage('Categorie invalide'),

    body('basePrice')
      .isFloat({ min: 0 }).withMessage('Prix invalide'),

    body('minQuantity')
      .isInt({ min: 1 }).withMessage('Quantite minimum: 1'),

    body('colors')
      .optional()
      .isArray().withMessage('Doit etre un tableau'),

    body('sizes')
      .optional()
      .isArray().withMessage('Doit etre un tableau'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Maximum 500 caracteres')
  ])
};

// Validation stock
const validateStock = {
  create: validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Nom requis')
      .isLength({ min: 2, max: 100 }).withMessage('Entre 2 et 100 caracteres'),

    body('category')
      .trim()
      .notEmpty().withMessage('Categorie requise')
      .isIn(['Encre', 'Support', 'Outillage', 'Emballage']).withMessage('Categorie invalide'),

    body('quantity')
      .isInt({ min: 0 }).withMessage('Quantite invalide'),

    body('unit')
      .trim()
      .notEmpty().withMessage('Unite requise')
      .isIn(['Litre', 'Piece', 'Kg', 'Rouleau', 'Boite']).withMessage('Unite invalide'),

    body('minLevel')
      .isInt({ min: 0 }).withMessage('Niveau minimum invalide'),

    body('unitCost')
      .isFloat({ min: 0 }).withMessage('Cout unitaire invalide')
  ]),

  update: validate([
    body('quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Quantite invalide'),

    body('minLevel')
      .optional()
      .isInt({ min: 0 }).withMessage('Niveau minimum invalide'),

    body('unitCost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Cout unitaire invalide')
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

// Validation requetes avec pagination
const validatePagination = validate([
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page doit etre >= 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit entre 1 et 100')
    .toInt(),

  query('sort')
    .optional()
    .isString().withMessage('Sort doit etre une chaine'),

  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Order doit etre asc ou desc')
]);

// Validation telephone malgache
const validateMalagasyPhone = (phone) => {
  const regex = /^(\+261|0)(32|33|34|38)\d{7}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

// Middleware personnalise pour telephone MG
const validatePhoneMG = (field) => {
  return body(field)
    .custom(value => {
      if (!value) return true;
      return validateMalagasyPhone(value);
    })
    .withMessage('Numero de telephone malgache invalide. Format: +261 32 123 4567 ou 032 12 345 67');
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

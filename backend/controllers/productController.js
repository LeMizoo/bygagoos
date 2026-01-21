const productService = require('../services/productService');
const { validationResult } = require('express-validator');

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      category: req.query.category,
      search: req.query.search
    };

    const result = await productService.findAll(page, limit, filters);
    res.json(result);

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur' 
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productService.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Produit non trouvé' 
      });
    }
    
    res.json(product);

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur' 
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await productService.create(req.body);
    res.status(201).json(product);

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur' 
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await productService.update(req.params.id, req.body);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Produit non trouvé' 
      });
    }
    
    res.json(product);

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur' 
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await productService.delete(req.params.id);
    res.json({ 
      message: 'Produit supprimé avec succès' 
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur' 
    });
  }
};

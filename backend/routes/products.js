const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, lowStock = false } = req.query;
    
    const where = {};
    
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (lowStock === 'true') {
      where.stock = { lte: prisma.product.fields.minStock };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
});

// Get product categories
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category']
    });

    res.json({
      success: true,
      categories: categories.map(c => c.category).filter(Boolean)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

// Create product
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, category, stock, minStock, image } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        minStock: parseInt(minStock) || 10,
        image
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_PRODUCT',
        details: `Produit créé: ${name}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit'
    });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, category, stock, minStock, image } = req.body;

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        category,
        stock: stock ? parseInt(stock) : undefined,
        minStock: minStock ? parseInt(minStock) : undefined,
        image,
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_PRODUCT',
        details: `Produit mis à jour: ${name}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit'
    });
  }
});

module.exports = router;
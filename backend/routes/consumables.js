const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all consumables
router.get('/', auth, async (req, res) => {
  try {
    const { category, lowStock = false } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (lowStock === 'true') {
      where.stock = { lte: prisma.consumable.fields.minStock };
    }

    const consumables = await prisma.consumable.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, consumables });
  } catch (error) {
    console.error('Get consumables error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des consommables'
    });
  }
});

// Update consumable
router.patch('/:id', auth, async (req, res) => {
  try {
    const consumableId = parseInt(req.params.id);
    const { quantity, action = 'SET', supplier, lastOrderDate } = req.body;

    const consumable = await prisma.consumable.findUnique({
      where: { id: consumableId }
    });

    if (!consumable) {
      return res.status(404).json({
        success: false,
        message: 'Consommable non trouvé'
      });
    }

    let newStock = consumable.stock;
    switch (action) {
      case 'INCREMENT':
        newStock += parseInt(quantity);
        break;
      case 'DECREMENT':
        newStock -= parseInt(quantity);
        break;
      case 'SET':
      default:
        newStock = parseInt(quantity);
    }

    // Ensure stock doesn't go negative
    newStock = Math.max(0, newStock);

    const updateData = { 
      stock: newStock,
      updatedAt: new Date() 
    };
    
    if (supplier) updateData.supplier = supplier;
    if (lastOrderDate) updateData.lastOrderDate = new Date(lastOrderDate);

    const updatedConsumable = await prisma.consumable.update({
      where: { id: consumableId },
      data: updateData
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_CONSUMABLE',
        details: `Consommable mis à jour: ${consumable.name} (${consumable.stock} → ${newStock})`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Consommable mis à jour avec succès',
      consumable: updatedConsumable
    });
  } catch (error) {
    console.error('Update consumable error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du consommable'
    });
  }
});

// Create consumable
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, stock, minStock, unit, supplier } = req.body;

    const consumable = await prisma.consumable.create({
      data: {
        name,
        description,
        category,
        stock: parseInt(stock),
        minStock: parseInt(minStock) || 5,
        unit: unit || 'pièce',
        supplier
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_CONSUMABLE',
        details: `Consommable créé: ${name}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Consommable créé avec succès',
      consumable
    });
  } catch (error) {
    console.error('Create consumable error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du consommable'
    });
  }
});

module.exports = router;
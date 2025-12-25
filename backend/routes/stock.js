const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Obtenir l'état du stock (produits et consommables)
router.get('/', auth, async (req, res) => {
  try {
    const [products, consumables] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          category: true
        }
      }),
      prisma.consumable.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          category: true,
          unit: true
        }
      })
    ]);

    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    const lowStockConsumables = consumables.filter(c => c.stock <= c.minStock);

    res.json({
      products: {
        all: products,
        lowStock: lowStockProducts
      },
      consumables: {
        all: consumables,
        lowStock: lowStockConsumables
      },
      alerts: {
        products: lowStockProducts.length,
        consumables: lowStockConsumables.length,
        total: lowStockProducts.length + lowStockConsumables.length
      }
    });
  } catch (error) {
    console.error('Erreur récupération stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les alertes de stock faible
router.get('/alerts', auth, async (req, res) => {
  try {
    const [lowStockProducts, lowStockConsumables] = await Promise.all([
      prisma.product.findMany({
        where: {
          stock: {
            lte: prisma.product.fields.minStock
          }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          category: true
        }
      }),
      prisma.consumable.findMany({
        where: {
          stock: {
            lte: prisma.consumable.fields.minStock
          }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          category: true,
          unit: true
        }
      })
    ]);

    res.json({
      products: lowStockProducts,
      consumables: lowStockConsumables,
      total: lowStockProducts.length + lowStockConsumables.length
    });
  } catch (error) {
    console.error('Erreur récupération alertes stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
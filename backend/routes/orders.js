const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const {
      status,
      clientId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (clientId) where.clientId = parseInt(clientId);
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          orderItems: {
            include: {
              product: {
                select: { name: true, price: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      orders: orders.map(order => ({
        ...order,
        client: order.client,
        items: order.orderItems
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const {
      clientId,
      orderNumber,
      items,
      notes,
      status = 'PENDING',
      deliveryDate
    } = req.body;

    // Calculer le montant total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Créer la commande avec transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          clientId: parseInt(clientId),
          totalAmount,
          notes,
          status,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null
        }
      });

      // Ajouter les items
      await tx.orderItem.createMany({
        data: items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      });

      return newOrder;
    });

    // Log l'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_ORDER',
        details: `Commande créée: ${order.orderNumber}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande'
    });
  }
});

// Update order
router.put('/:id', auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, notes, deliveryDate } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        notes,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        updatedAt: new Date()
      }
    });

    // Log l'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_ORDER',
        details: `Commande mise à jour: ${order.orderNumber}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Commande mise à jour avec succès',
      order
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la commande'
    });
  }
});

// Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    await prisma.order.delete({
      where: { id: orderId }
    });

    // Log l'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_ORDER',
        details: `Commande supprimée: ${order.orderNumber}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Commande supprimée avec succès'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la commande'
    });
  }
});

module.exports = router;
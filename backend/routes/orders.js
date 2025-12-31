// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Générer un numéro de commande unique
const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `CMD-${year}${month}`;
  
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      orderNumber: 'desc'
    }
  });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop());
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }
  
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// GET /api/orders - Récupérer toutes les commandes avec filtres
router.get('/', auth, async (req, res) => {
  try {
    const {
      status,
      clientId,
      priority,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (clientId) where.clientId = parseInt(clientId);
    if (priority) where.priority = priority;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
              phone: true
            }
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          },
          tasks: {
            select: {
              id: true,
              name: true,
              status: true,
              assignedTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
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

    // Calculer les statistiques
    const stats = {
      total,
      pending: await prisma.order.count({ where: { status: 'PENDING' } }),
      inProgress: await prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
      completed: await prisma.order.count({ where: { status: 'COMPLETED' } }),
      delivered: await prisma.order.count({ where: { status: 'DELIVERED' } }),
      cancelled: await prisma.order.count({ where: { status: 'CANCELLED' } }),
      totalRevenue: await prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true }
      })
    };

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// GET /api/orders/stats - Statistiques des commandes
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOrders,
      totalRevenue,
      thisMonthOrders,
      thisMonthRevenue,
      lastMonthOrders,
      lastMonthRevenue,
      ordersByStatus
    ] = await Promise.all([
      // Total des commandes
      prisma.order.count({
        where: { status: { not: 'CANCELLED' } }
      }),
      
      // Total revenue
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true }
      }),
      
      // Commandes ce mois
      prisma.order.count({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Revenue ce mois
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startOfMonth }
        },
        _sum: { totalAmount: true }
      }),
      
      // Commandes mois dernier
      prisma.order.count({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
        }
      }),
      
      // Revenue mois dernier
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
        },
        _sum: { totalAmount: true }
      }),
      
      // Commandes par statut
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    // Calculer la croissance
    const growthRate = lastMonthOrders > 0 
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        thisMonth: {
          orders: thisMonthOrders,
          revenue: thisMonthRevenue._sum.totalAmount || 0
        },
        lastMonth: {
          orders: lastMonthOrders,
          revenue: lastMonthRevenue._sum.totalAmount || 0
        },
        growthRate: parseFloat(growthRate.toFixed(2)),
        byStatus: ordersByStatus
      }
    });

  } catch (error) {
    console.error('Get orders stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// POST /api/orders - Créer une nouvelle commande
router.post('/', auth, async (req, res) => {
  try {
    const {
      clientId,
      items,
      notes,
      status = 'PENDING',
      deliveryDate,
      deadline,
      priority = 'MEDIUM'
    } = req.body;

    // Vérifier le client
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Vérifier les produits et calculer le total
    let totalAmount = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit non trouvé: ${item.productId}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}, Demandé: ${item.quantity}`
        });
      }

      totalAmount += product.price * item.quantity;
    }

    // Générer le numéro de commande
    const orderNumber = await generateOrderNumber();

    // Créer la commande avec transaction
    const order = await prisma.$transaction(async (tx) => {
      // Créer la commande
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          clientId: parseInt(clientId),
          totalAmount,
          notes,
          status,
          priority,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          deadline: deadline ? new Date(deadline) : null
        }
      });

      // Ajouter les items et mettre à jour le stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(item.productId) }
        });

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: parseInt(item.productId),
            quantity: item.quantity,
            price: product.price,
            notes: item.notes
          }
        });

        // Mettre à jour le stock
        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: {
            stock: product.stock - item.quantity
          }
        });
      }

      // Créer les tâches de production par défaut
      const defaultTasks = [
        { type: 'DESIGN', name: 'Conception graphique' },
        { type: 'SCREEN_PREPARATION', name: 'Préparation des écrans' },
        { type: 'PRINTING', name: 'Impression sérigraphie' },
        { type: 'DRYING', name: 'Séchage' },
        { type: 'QUALITY_CHECK', name: 'Contrôle qualité' },
        { type: 'PACKAGING', name: 'Emballage' }
      ];

      for (const task of defaultTasks) {
        await tx.task.create({
          data: {
            orderId: newOrder.id,
            type: task.type,
            name: task.name,
            status: 'PENDING'
          }
        });
      }

      return newOrder;
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_ORDER',
        details: `Commande créée: ${order.orderNumber} pour ${client.name}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande'
    });
  }
});

// GET /api/orders/:id - Récupérer une commande spécifique
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
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
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
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

// PUT /api/orders/:id - Mettre à jour une commande
router.put('/:id', auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, notes, deliveryDate, deadline, priority } = req.body;

    // Vérifier que la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        notes,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        priority,
        updatedAt: new Date()
      }
    });

    // Si le statut passe à IN_PROGRESS, mettre à jour les tâches
    if (status === 'IN_PROGRESS' && existingOrder.status !== 'IN_PROGRESS') {
      await prisma.task.updateMany({
        where: { orderId: orderId, status: 'PENDING' },
        data: { status: 'IN_PROGRESS' }
      });
    }

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_ORDER',
        details: `Commande ${order.orderNumber} mise à jour. Statut: ${status}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Commande mise à jour avec succès',
      data: order
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la commande'
    });
  }
});

// DELETE /api/orders/:id - Supprimer une commande
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

    // Seules les commandes PENDING ou CANCELLED peuvent être supprimées
    if (!['PENDING', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Seules les commandes en attente ou annulées peuvent être supprimées'
      });
    }

    // Supprimer avec transaction
    await prisma.$transaction(async (tx) => {
      // Récupérer et restaurer le stock
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: orderId },
        include: { product: true }
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: item.product.stock + item.quantity
          }
        });
      }

      // Supprimer les items
      await tx.orderItem.deleteMany({
        where: { orderId: orderId }
      });

      // Supprimer les tâches
      await tx.task.deleteMany({
        where: { orderId: orderId }
      });

      // Supprimer la commande
      await tx.order.delete({
        where: { id: orderId }
      });
    });

    // Log d'activité
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

// GET /api/orders/:id/tasks - Tâches de production d'une commande
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const tasks = await prisma.task.findMany({
      where: { orderId: orderId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('Get order tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tâches'
    });
  }
});

// POST /api/orders/:id/items - Ajouter un article à une commande
router.post('/:id/items', auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { productId, quantity, notes } = req.body;

    // Vérifier la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier le produit
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Disponible: ${product.stock}`
      });
    }

    // Ajouter l'article
    const orderItem = await prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.create({
        data: {
          orderId: orderId,
          productId: parseInt(productId),
          quantity: quantity,
          price: product.price,
          notes: notes
        }
      });

      // Mettre à jour le stock
      await tx.product.update({
        where: { id: parseInt(productId) },
        data: {
          stock: product.stock - quantity
        }
      });

      // Recalculer le total
      const items = await tx.orderItem.findMany({
        where: { orderId: orderId }
      });

      const totalAmount = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: totalAmount }
      });

      return item;
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ADD_ORDER_ITEM',
        details: `Article ajouté à la commande ${order.orderNumber}: ${product.name} x${quantity}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Article ajouté avec succès',
      data: orderItem
    });

  } catch (error) {
    console.error('Add order item error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'article'
    });
  }
});

module.exports = router;
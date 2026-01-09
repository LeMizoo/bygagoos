const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Client = require('../models/Client');
const Product = require('../models/Product');
const { auth, roleAuth } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');
const logger = require('../utils/logger');

// GET toutes les commandes (avec filtres)
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

    const filter = {};
    
    // Filtre par statut
    if (status) {
      filter.status = status;
    }
    
    // Filtre par client
    if (clientId) {
      filter.clientId = clientId;
    }
    
    // Filtre par date
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('client', 'companyName contactName phone')
      .populate('user', 'firstName lastName')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Erreur récupération commandes: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// GET une commande spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client')
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name description basePrice'
        }
      });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'client' && order.client._id.toString() !== req.user.clientId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error(`Erreur récupération commande ${req.params.id}: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// POST créer une nouvelle commande
router.post('/', auth, validateOrder, async (req, res) => {
  try {
    const { clientId, items, deliveryDate, notes, priority } = req.body;
    
    // Vérifier le client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client non trouvé' 
      });
    }

    // Calculer le total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: `Produit ${item.productId} non disponible` 
        });
      }

      if (item.quantity < product.minQuantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Quantité minimum pour ${product.name}: ${product.minQuantity}` 
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        color: item.color,
        size: item.size,
        notes: item.notes
      });
    }

    // Générer numéro de commande
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const count = await Order.countDocuments({
      orderDate: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 1),
        $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
      }
    });
    const orderNumber = `CMD-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;

    // Créer la commande
    const order = new Order({
      orderNumber,
      clientId,
      userId: req.user._id,
      status: 'pending',
      priority: priority || 'normal',
      items: orderItems,
      totalAmount,
      deposit: 0,
      balance: totalAmount,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      notes,
      orderDate: today
    });

    await order.save();

    // Populer pour la réponse
    const populatedOrder = await Order.findById(order._id)
      .populate('client')
      .populate('user', 'firstName lastName');

    logger.info(`Nouvelle commande créée: ${orderNumber} par ${req.user.email}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Commande créée avec succès',
      data: populatedOrder 
    });
  } catch (error) {
    logger.error(`Erreur création commande: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur création commande' 
    });
  }
});

// PUT mettre à jour une commande
router.put('/:id', auth, roleAuth('admin', 'manager'), async (req, res) => {
  try {
    const { status, deposit, notes, priority } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    // Mettre à jour les champs autorisés
    const updates = {};
    if (status && order.status !== 'cancelled') {
      updates.status = status;
      if (status === 'delivered') {
        updates.completedAt = new Date();
      }
    }
    
    if (deposit !== undefined) {
      updates.deposit = parseFloat(deposit);
      updates.balance = order.totalAmount - updates.deposit;
    }
    
    if (notes !== undefined) updates.notes = notes;
    if (priority) updates.priority = priority;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('client').populate('user', 'firstName lastName');

    logger.info(`Commande ${order.orderNumber} mise à jour par ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Commande mise à jour',
      data: updatedOrder 
    });
  } catch (error) {
    logger.error(`Erreur mise à jour commande: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur mise à jour commande' 
    });
  }
});

// DELETE annuler une commande
router.delete('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    // Vérifier si la commande peut être annulée
    if (order.status === 'delivered' || order.status === 'in_production') {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible d\'annuler une commande en production ou livrée' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    logger.info(`Commande ${order.orderNumber} annulée par ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Commande annulée' 
    });
  } catch (error) {
    logger.error(`Erreur annulation commande: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur annulation commande' 
    });
  }
});

// GET statistiques commandes
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Commandes du mois
    const monthlyOrders = await Order.countDocuments({
      orderDate: { $gte: startOfMonth }
    });

    // Chiffre d'affaires du mois
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          received: { $sum: '$deposit' }
        }
      }
    ]);

    // Commandes par statut
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Commandes urgentes
    const urgentOrders = await Order.countDocuments({
      priority: 'urgent',
      status: { $in: ['pending', 'confirmed', 'in_production'] }
    });

    res.json({
      success: true,
      data: {
        monthlyOrders,
        monthlyRevenue: monthlyRevenue[0] || { total: 0, received: 0 },
        ordersByStatus,
        urgentOrders,
        pendingOrders: await Order.countDocuments({ status: 'pending' })
      }
    });
  } catch (error) {
    logger.error(`Erreur statistiques: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur récupération statistiques' 
    });
  }
});

module.exports = router;
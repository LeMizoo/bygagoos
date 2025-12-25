const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Statistiques du dashboard (protégé)
router.get('/stats', auth, async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalClients,
      totalProducts,
      recentOrders,
      monthlyRevenue
    ] = await Promise.all([
      // Total des commandes
      prisma.order.count(),
      
      // Commandes en attente
      prisma.order.count({
        where: { status: 'PENDING' }
      }),
      
      // Commandes terminées
      prisma.order.count({
        where: { status: 'COMPLETED' }
      }),
      
      // Total clients
      prisma.client.count(),
      
      // Total produits
      prisma.product.count(),
      
      // Commandes récentes (7 derniers jours)
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: {
            select: { name: true }
          }
        }
      }),
      
      // Revenu mensuel
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalClients,
        totalProducts,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        clientName: order.client?.name || 'N/A',
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }))
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Activités récentes
router.get('/activities', auth, async (req, res) => {
  try {
    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.json({
      success: true,
      activities: activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
        createdAt: activity.createdAt
      }))
    });

  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités'
    });
  }
});

module.exports = router;
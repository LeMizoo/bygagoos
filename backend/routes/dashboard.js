const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware d'authentification
const authenticate = require('../middleware/auth');

// Statistiques dashboard
router.get('/stats', authenticate, async (req, res) => {
  try {
    // Récupérer les statistiques en parallèle
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      activeClients,
      lowStockItems
    ] = await Promise.all([
      // Total commandes
      prisma.order.count(),
      
      // Commandes en attente
      prisma.order.count({
        where: { status: 'PENDING' }
      }),
      
      // Commandes terminées
      prisma.order.count({
        where: { 
          OR: [
            { status: 'DELIVERED' },
            { status: 'READY' }
          ]
        }
      }),
      
      // Chiffre d'affaires
      prisma.order.aggregate({
        where: { 
          OR: [
            { status: 'DELIVERED' },
            { status: 'READY' }
          ]
        },
        _sum: { totalPrice: true }
      }),
      
      // Clients actifs (ont commandé dans les 30 derniers jours)
      prisma.client.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
      
      // Produits en rupture de stock
      prisma.stock.count({
        where: {
          quantity: {
            lte: 10
          }
        }
      })
    ]);

    // Commandes récentes
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            contactName: true,
            companyName: true
          }
        }
      }
    });

    // Graphique des commandes des 30 derniers jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const ordersByDay = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        SUM(totalPrice) as revenue
      FROM orders
      WHERE createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        activeClients,
        lowStockItems
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        client: order.client.contactName,
        company: order.client.companyName,
        amount: order.totalPrice,
        status: order.status,
        date: order.createdAt
      })),
      chartData: ordersByDay
    });

  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;
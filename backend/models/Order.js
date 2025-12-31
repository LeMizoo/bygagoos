// backend/models/Order.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../middleware/logger');

class Order {
  // Générer un numéro de commande unique
  static async generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Chercher la dernière commande du mois
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `CMD-${year}${month}`
        }
      },
      orderBy: {
        orderNumber: 'desc'
      }
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `CMD-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // Créer une nouvelle commande
  static async createOrder(orderData, userId) {
    try {
      // Générer le numéro de commande
      const orderNumber = orderData.orderNumber || await this.generateOrderNumber();
      
      // Calculer le total
      let totalAmount = 0;
      const orderItems = [];
      
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          let product = null;
          let unitPrice = item.unitPrice;
          
          if (item.productId) {
            product = await prisma.product.findUnique({
              where: { id: item.productId }
            });
            
            if (!product) {
              throw new Error(`Produit non trouvé: ${item.productId}`);
            }
            
            unitPrice = unitPrice || product.price;
          } else if (!unitPrice) {
            throw new Error('Prix unitaire requis pour les articles sans produit');
          }
          
          const itemTotal = unitPrice * item.quantity;
          totalAmount += itemTotal;
          
          orderItems.push({
            productId: item.productId || null,
            variantId: item.variantId || null,
            name: item.name || product?.name || 'Article sans nom',
            description: item.description || product?.description,
            quantity: item.quantity,
            unitPrice: unitPrice,
            totalPrice: itemTotal,
            notes: item.notes,
            designFile: item.designFile,
            designNotes: item.designNotes,
            printingDetails: item.printingDetails
          });
        }
      }

      // Appliquer taxe et remise
      const taxRate = orderData.taxRate || 0;
      const discount = orderData.discount || 0;
      const taxAmount = (totalAmount - discount) * (taxRate / 100);
      const finalTotal = totalAmount - discount + taxAmount;

      // Créer la commande
      const order = await prisma.order.create({
        data: {
          orderNumber,
          clientId: orderData.clientId,
          createdById: userId,
          assignedToId: orderData.assignedToId || userId,
          status: orderData.status || 'PENDING',
          priority: orderData.priority || 'MEDIUM',
          type: orderData.type || 'REGULAR',
          totalAmount: finalTotal,
          paidAmount: orderData.paidAmount || 0,
          discount: discount,
          tax: taxAmount,
          notes: orderData.notes,
          internalNotes: orderData.internalNotes,
          deadline: orderData.deadline ? new Date(orderData.deadline) : null,
          deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : null,
          orderItems: {
            create: orderItems
          }
        },
        include: {
          client: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          orderItems: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      // Mettre à jour le client
      if (orderData.clientId) {
        await prisma.client.update({
          where: { id: orderData.clientId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: finalTotal },
            lastOrderDate: new Date()
          }
        });
      }

      // Log d'activité
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ORDER_CREATED',
          entityType: 'Order',
          entityId: order.id,
          details: {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            clientId: order.clientId
          },
          ipAddress: 'system',
          userAgent: 'BYGAGOOS_API'
        }
      });

      logger.info(`Nouvelle commande créée: ${order.orderNumber} par userId: ${userId}`);

      return order;

    } catch (error) {
      logger.error(`Erreur création commande: ${error.message}`);
      throw error;
    }
  }

  // Obtenir une commande par ID
  static async getOrderById(id, includeDetails = true) {
    const include = {
      client: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true
        }
      },
      orderItems: {
        include: {
          product: true,
          variant: true
        }
      },
      tasks: {
        orderBy: { createdAt: 'asc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      },
      payments: {
        orderBy: { createdAt: 'desc' }
      },
      files: {
        orderBy: { createdAt: 'desc' }
      }
    };

    return await prisma.order.findUnique({
      where: { id },
      include: includeDetails ? include : undefined
    });
  }

  // Obtenir une commande par numéro
  static async getOrderByNumber(orderNumber) {
    return await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        client: true,
        orderItems: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });
  }

  // Lister les commandes avec filtres
  static async getOrders(filters = {}) {
    const where = {
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.type && { type: filters.type }),
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters.createdById && { createdById: filters.createdById }),
      ...(filters.search && {
        OR: [
          { orderNumber: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } },
          { client: { 
            name: { contains: filters.search, mode: 'insensitive' }
          }}
        ]
      }),
      ...(filters.startDate && filters.endDate && {
        createdAt: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        }
      }),
      ...(filters.deadlineStart && filters.deadlineEnd && {
        deadline: {
          gte: new Date(filters.deadlineStart),
          lte: new Date(filters.deadlineEnd)
        }
      })
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              orderItems: true,
              tasks: true
            }
          }
        },
        orderBy: {
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc'
        },
        skip: filters.skip || 0,
        take: filters.limit || 50
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      total,
      page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 50))
    };
  }

  // Mettre à jour une commande
  static async updateOrder(id, updateData, userId) {
    // Vérifier que la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new Error('Commande non trouvée');
    }

    // Ne pas permettre de modifier certaines commandes
    if (existingOrder.status === 'CANCELLED' || existingOrder.status === 'DELIVERED') {
      throw new Error(`Impossible de modifier une commande ${existingOrder.status.toLowerCase()}`);
    }

    const allowedUpdates = [
      'assignedToId', 'status', 'priority', 'notes', 'internalNotes',
      'deadline', 'deliveryDate', 'discount', 'tax'
    ];

    const dataToUpdate = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    });

    dataToUpdate.updatedAt = new Date();

    const order = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: {
        client: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ORDER_UPDATED',
        entityType: 'Order',
        entityId: id,
        details: {
          updatedFields: Object.keys(dataToUpdate),
          previousStatus: existingOrder.status,
          newStatus: order.status
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Commande mise à jour: ${order.orderNumber} par userId: ${userId}`);

    return order;
  }

  // Annuler une commande
  static async cancelOrder(id, reason, userId) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    if (order.status === 'CANCELLED') {
      throw new Error('Commande déjà annulée');
    }

    // Mettre à jour la commande
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Restocker les produits si nécessaire
    for (const item of order.orderItems) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity }
          }
        });
      }
    }

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ORDER_CANCELLED',
        entityType: 'Order',
        entityId: id,
        details: {
          reason,
          previousStatus: order.status,
          orderNumber: order.orderNumber
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Commande annulée: ${order.orderNumber} par userId: ${userId}`);

    return cancelledOrder;
  }

  // Ajouter un paiement
  static async addPayment(orderId, paymentData, userId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference,
        status: paymentData.status || 'COMPLETED',
        notes: paymentData.notes,
        paidAt: paymentData.paidAt ? new Date(paymentData.paidAt) : new Date()
      }
    });

    // Mettre à jour le montant payé de la commande
    const newPaidAmount = order.paidAmount + paymentData.amount;
    const isFullyPaid = newPaidAmount >= order.totalAmount;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paidAmount: newPaidAmount,
        paidAt: isFullyPaid ? new Date() : null,
        status: isFullyPaid && order.status !== 'DELIVERED' ? 'READY_FOR_DELIVERY' : order.status
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PAYMENT_ADDED',
        entityType: 'Order',
        entityId: orderId,
        details: {
          paymentId: payment.id,
          amount: payment.amount,
          method: payment.method,
          reference: payment.reference
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    return payment;
  }

  // Obtenir les statistiques des commandes
  static async getOrderStats(timeRange = 'month') {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      inProgressOrders,
      deliveredOrders,
      cancelledOrders,
      averageOrderValue,
      topClients
    ] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({
        where: { status: 'PENDING' }
      }),
      prisma.order.count({
        where: { status: 'IN_PROGRESS' }
      }),
      prisma.order.count({
        where: { 
          status: 'DELIVERED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.order.count({
        where: { 
          status: 'CANCELLED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        },
        _avg: { totalAmount: true }
      }),
      prisma.order.groupBy({
        by: ['clientId'],
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: {
          _sum: {
            totalAmount: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Récupérer les noms des clients
    const topClientsWithNames = await Promise.all(
      topClients.map(async (client) => {
        const clientInfo = await prisma.client.findUnique({
          where: { id: client.clientId },
          select: { name: true, company: true }
        });
        
        return {
          clientId: client.clientId,
          name: clientInfo?.name || 'Client inconnu',
          company: clientInfo?.company,
          totalSpent: client._sum.totalAmount || 0,
          orderCount: client._count.id
        };
      })
    );

    // Répartition par statut
    const statusDistribution = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Répartition par priorité
    const priorityDistribution = await prisma.order.groupBy({
      by: ['priority'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      }
    });

    return {
      timeRange,
      period: { startDate, endDate: new Date() },
      totals: {
        orders: totalOrders,
        revenue: totalRevenue._sum.totalAmount || 0,
        averageOrderValue: averageOrderValue._avg.totalAmount || 0
      },
      status: {
        pending: pendingOrders,
        inProgress: inProgressOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      distribution: {
        status: statusDistribution.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        priority: priorityDistribution.reduce((acc, item) => {
          acc[item.priority] = item._count.id;
          return acc;
        }, {})
      },
      topClients: topClientsWithNames
    };
  }

  // Rechercher des commandes
  static async searchOrders(query, limit = 10) {
    return await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
          { client: { 
            name: { contains: query, mode: 'insensitive' }
          }},
          { client: { 
            email: { contains: query, mode: 'insensitive' }
          }}
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

module.exports = Order;
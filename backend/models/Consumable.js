// backend/models/Consumable.js (anciennement Stock.js)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../middleware/logger');

class Consumable {
  // Créer un nouveau consommable
  static async createConsumable(consumableData, userId) {
    try {
      // Vérifier l'unicité du SKU si fourni
      if (consumableData.sku) {
        const existingConsumable = await prisma.consumable.findUnique({
          where: { sku: consumableData.sku }
        });

        if (existingConsumable) {
          throw new Error('Un consommable avec ce SKU existe déjà');
        }
      }

      const consumable = await prisma.consumable.create({
        data: {
          sku: consumableData.sku,
          name: consumableData.name,
          description: consumableData.description,
          category: consumableData.category,
          unit: consumableData.unit || 'unit',
          stock: consumableData.stock || 0,
          minStock: consumableData.minStock || 5,
          reorderPoint: consumableData.reorderPoint,
          unitCost: consumableData.unitCost,
          supplier: consumableData.supplier,
          supplierContact: consumableData.supplierContact,
          lastOrdered: consumableData.lastOrdered ? new Date(consumableData.lastOrdered) : null,
          location: consumableData.location,
          notes: consumableData.notes
        }
      });

      // Log d'activité
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'CONSUMABLE_CREATED',
          entityType: 'Consumable',
          entityId: consumable.id,
          details: {
            sku: consumable.sku,
            name: consumable.name,
            category: consumable.category
          },
          ipAddress: 'system',
          userAgent: 'BYGAGOOS_API'
        }
      });

      logger.info(`Nouveau consommable créé: ${consumable.name} (SKU: ${consumable.sku}) par userId: ${userId}`);

      return consumable;

    } catch (error) {
      logger.error(`Erreur création consommable: ${error.message}`);
      throw error;
    }
  }

  // Obtenir un consommable par ID
  static async getConsumableById(id, includeLogs = false) {
    const include = {
      consumableLogs: includeLogs ? {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      } : false
    };

    return await prisma.consumable.findUnique({
      where: { id },
      include
    });
  }

  // Obtenir un consommable par SKU
  static async getConsumableBySku(sku) {
    return await prisma.consumable.findUnique({
      where: { sku }
    });
  }

  // Lister les consommables avec filtres
  static async getConsumables(filters = {}) {
    const where = {
      ...(filters.category && { category: filters.category }),
      ...(filters.lowStock && { 
        stock: { 
          lte: prisma.consumable.fields.minStock 
        }
      }),
      ...(filters.outOfStock && { stock: 0 }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { supplier: { contains: filters.search, mode: 'insensitive' } }
        ]
      }),
      ...(filters.supplier && { supplier: { contains: filters.supplier, mode: 'insensitive' } }),
      ...(filters.location && { location: { contains: filters.location, mode: 'insensitive' } })
    };

    const [consumables, total] = await Promise.all([
      prisma.consumable.findMany({
        where,
        include: {
          _count: {
            select: { consumableLogs: true }
          }
        },
        orderBy: {
          [filters.sortBy || 'name']: filters.sortOrder || 'asc'
        },
        skip: filters.skip || 0,
        take: filters.limit || 50
      }),
      prisma.consumable.count({ where })
    ]);

    return {
      consumables,
      total,
      page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 50))
    };
  }

  // Mettre à jour un consommable
  static async updateConsumable(id, updateData, userId) {
    // Vérifier que le consommable existe
    const existingConsumable = await prisma.consumable.findUnique({
      where: { id }
    });

    if (!existingConsumable) {
      throw new Error('Consommable non trouvé');
    }

    // Vérifier l'unicité du SKU si modifié
    if (updateData.sku && updateData.sku !== existingConsumable.sku) {
      const skuExists = await prisma.consumable.findUnique({
        where: { sku: updateData.sku }
      });

      if (skuExists) {
        throw new Error('Ce SKU est déjà utilisé par un autre consommable');
      }
    }

    const allowedUpdates = [
      'sku', 'name', 'description', 'category', 'unit', 'stock',
      'minStock', 'reorderPoint', 'unitCost', 'supplier', 'supplierContact',
      'lastOrdered', 'location', 'notes'
    ];

    const dataToUpdate = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = field === 'lastOrdered' && updateData[field] 
          ? new Date(updateData[field]) 
          : updateData[field];
      }
    });

    dataToUpdate.updatedAt = new Date();

    const consumable = await prisma.consumable.update({
      where: { id },
      data: dataToUpdate
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CONSUMABLE_UPDATED',
        entityType: 'Consumable',
        entityId: id,
        details: {
          updatedFields: Object.keys(dataToUpdate),
          sku: consumable.sku,
          name: consumable.name
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Consommable mis à jour: ${consumable.name} (ID: ${id}) par userId: ${userId}`);

    return consumable;
  }

  // Supprimer un consommable
  static async deleteConsumable(id, userId) {
    const consumable = await prisma.consumable.findUnique({
      where: { id },
      include: {
        consumableLogs: true
      }
    });

    if (!consumable) {
      throw new Error('Consommable non trouvé');
    }

    // Vérifier s'il est utilisé dans des logs
    if (consumable.consumableLogs.length > 0) {
      throw new Error('Impossible de supprimer un consommable avec des historiques');
    }

    await prisma.consumable.delete({
      where: { id }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CONSUMABLE_DELETED',
        entityType: 'Consumable',
        entityId: id,
        details: {
          sku: consumable.sku,
          name: consumable.name
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Consommable supprimé: ${consumable.name} (ID: ${id}) par userId: ${userId}`);

    return { success: true, message: 'Consommable supprimé' };
  }

  // Mettre à jour le stock
  static async updateStock(consumableId, quantity, type, userId, reason = '', reference = null) {
    const consumable = await prisma.consumable.findUnique({
      where: { id: consumableId }
    });

    if (!consumable) {
      throw new Error('Consommable non trouvé');
    }

    let newStock;
    let quantityChange;

    switch (type) {
      case 'IN':
        newStock = consumable.stock + quantity;
        quantityChange = quantity;
        break;
      case 'OUT':
        if (consumable.stock < quantity) {
          throw new Error(`Stock insuffisant: ${consumable.stock} disponible, ${quantity} demandé`);
        }
        newStock = consumable.stock - quantity;
        quantityChange = -quantity;
        break;
      case 'ADJUSTMENT':
        newStock = quantity;
        quantityChange = quantity - consumable.stock;
        break;
      case 'WASTE':
        if (consumable.stock < quantity) {
          throw new Error(`Stock insuffisant pour gaspillage`);
        }
        newStock = consumable.stock - quantity;
        quantityChange = -quantity;
        break;
      case 'RETURN':
        newStock = consumable.stock + quantity;
        quantityChange = quantity;
        break;
      default:
        throw new Error('Type de mouvement invalide');
    }

    if (newStock < 0) {
      throw new Error('Stock ne peut pas être négatif');
    }

    // Mettre à jour le stock
    const updatedConsumable = await prisma.consumable.update({
      where: { id: consumableId },
      data: {
        stock: newStock,
        updatedAt: new Date(),
        ...(type === 'IN' && { lastOrdered: new Date() })
      }
    });

    // Créer un log
    const log = await prisma.consumableLog.create({
      data: {
        consumableId,
        type,
        quantity: Math.abs(quantityChange),
        previousStock: consumable.stock,
        newStock,
        referenceId: reference?.id,
        referenceType: reference?.type,
        notes: reason,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CONSUMABLE_STOCK_UPDATED',
        entityType: 'Consumable',
        entityId: consumableId,
        details: {
          logId: log.id,
          type: type,
          quantityChange: quantityChange,
          previousStock: consumable.stock,
          newStock: newStock,
          reason: reason
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    // Vérifier si le stock est bas
    if (newStock <= consumable.minStock) {
      logger.warn(`Stock bas pour consommable: ${consumable.name} (ID: ${consumableId}) - Stock: ${newStock}, Min: ${consumable.minStock}`);
    }

    return {
      consumable: updatedConsumable,
      log
    };
  }

  // Obtenir l'historique des mouvements
  static async getStockHistory(consumableId, filters = {}) {
    const where = {
      consumableId,
      ...(filters.type && { type: filters.type }),
      ...(filters.referenceType && { referenceType: filters.referenceType }),
      ...(filters.startDate && filters.endDate && {
        createdAt: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        }
      })
    };

    const [logs, total] = await Promise.all([
      prisma.consumableLog.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: filters.skip || 0,
        take: filters.limit || 50
      }),
      prisma.consumableLog.count({ where })
    ]);

    return {
      logs,
      total,
      page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 50))
    };
  }

  // Obtenir les statistiques des consommables
  static async getConsumableStats() {
    const [
      totalConsumables,
      totalStockValue,
      lowStockConsumables,
      outOfStockConsumables,
      categories,
      recentMovements
    ] = await Promise.all([
      prisma.consumable.count(),
      prisma.consumable.aggregate({
        _sum: {
          stock: true
        }
      }),
      prisma.consumable.count({
        where: {
          stock: {
            lte: prisma.consumable.fields.minStock,
            gt: 0
          }
        }
      }),
      prisma.consumable.count({
        where: {
          stock: 0
        }
      }),
      prisma.consumable.groupBy({
        by: ['category'],
        _count: { id: true },
        _sum: { stock: true }
      }),
      prisma.consumableLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          consumable: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    // Calculer la valeur totale du stock
    const consumablesWithCost = await prisma.consumable.findMany({
      where: {
        unitCost: { not: null },
        stock: { gt: 0 }
      },
      select: {
        stock: true,
        unitCost: true
      }
    });

    const totalValue = consumablesWithCost.reduce((sum, item) => {
      return sum + (item.stock * (item.unitCost || 0));
    }, 0);

    return {
      totals: {
        all: totalConsumables,
        lowStock: lowStockConsumables,
        outOfStock: outOfStockConsumables,
        stockValue: totalValue
      },
      categories: categories.reduce((acc, item) => {
        acc[item.category] = {
          count: item._count.id,
          totalStock: item._sum.stock || 0
        };
        return acc;
      }, {}),
      recentMovements
    };
  }

  // Obtenir les consommables avec stock bas
  static async getLowStockConsumables() {
    return await prisma.consumable.findMany({
      where: {
        stock: {
          lte: prisma.consumable.fields.minStock
        }
      },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        stock: true,
        minStock: true,
        unit: true,
        unitCost: true,
        supplier: true,
        location: true
      },
      orderBy: [
        { stock: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  // Rechercher des consommables
  static async searchConsumables(query, limit = 10) {
    return await prisma.consumable.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { supplier: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        unit: true,
        stock: true,
        minStock: true,
        unitCost: true,
        supplier: true,
        location: true
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });
  }

  // Commander des consommables (simuler une commande)
  static async orderConsumables(orderData, userId) {
    const results = [];
    const errors = [];

    for (const item of orderData.items) {
      try {
        const result = await this.updateStock(
          item.consumableId,
          item.quantity,
          'IN',
          userId,
          `Commande fournisseur: ${orderData.reference || 'N/A'}`,
          { id: orderData.orderId, type: 'purchase_order' }
        );

        results.push({
          consumableId: item.consumableId,
          success: true,
          data: result
        });

      } catch (error) {
        errors.push({
          consumableId: item.consumableId,
          error: error.message
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };
  }

  // Utiliser des consommables dans une tâche
  static async useInTask(consumableId, quantity, taskId, userId, notes = '') {
    return await this.updateStock(
      consumableId,
      quantity,
      'OUT',
      userId,
      `Utilisation dans tâche: ${notes}`,
      { id: taskId, type: 'task' }
    );
  }

  // Ajuster le stock manuellement
  static async adjustStock(consumableId, newQuantity, userId, reason = 'Ajustement manuel') {
    return await this.updateStock(
      consumableId,
      newQuantity,
      'ADJUSTMENT',
      userId,
      reason
    );
  }

  // Enregistrer du gaspillage
  static async recordWaste(consumableId, quantity, userId, reason = 'Gaspillage') {
    return await this.updateStock(
      consumableId,
      quantity,
      'WASTE',
      userId,
      reason
    );
  }

  // Retourner des consommables
  static async returnConsumables(consumableId, quantity, userId, reason = 'Retour') {
    return await this.updateStock(
      consumableId,
      quantity,
      'RETURN',
      userId,
      reason
    );
  }
}

module.exports = Consumable;
// backend/models/Product.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../middleware/logger');

class Product {
  // Créer un nouveau produit
  static async createProduct(productData, userId) {
    try {
      // Vérifier l'unicité du SKU si fourni
      if (productData.sku) {
        const existingProduct = await prisma.product.findUnique({
          where: { sku: productData.sku }
        });

        if (existingProduct) {
          throw new Error('Un produit avec ce SKU existe déjà');
        }
      }

      const product = await prisma.product.create({
        data: {
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          shortDescription: productData.shortDescription,
          price: productData.price,
          cost: productData.cost,
          category: productData.category,
          subcategory: productData.subcategory,
          color: productData.color,
          size: productData.size,
          material: productData.material,
          stock: productData.stock || 0,
          minStock: productData.minStock || 10,
          maxStock: productData.maxStock,
          image: productData.image,
          images: productData.images || [],
          isActive: productData.isActive !== undefined ? productData.isActive : true
        }
      });

      // Ajouter des variantes si fournies
      if (productData.variants && productData.variants.length > 0) {
        for (const variantData of productData.variants) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variantData.sku || `${product.sku}-V${Math.random().toString(36).substr(2, 4)}`,
              name: variantData.name || product.name,
              price: variantData.price || product.price,
              stock: variantData.stock || 0,
              attributes: variantData.attributes || {},
              image: variantData.image,
              isActive: variantData.isActive !== undefined ? variantData.isActive : true
            }
          });
        }
      }

      // Log d'activité
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'PRODUCT_CREATED',
          entityType: 'Product',
          entityId: product.id,
          details: {
            sku: product.sku,
            name: product.name,
            category: product.category
          },
          ipAddress: 'system',
          userAgent: 'BYGAGOOS_API'
        }
      });

      logger.info(`Nouveau produit créé: ${product.name} (SKU: ${product.sku}) par userId: ${userId}`);

      return product;

    } catch (error) {
      logger.error(`Erreur création produit: ${error.message}`);
      throw error;
    }
  }

  // Obtenir un produit par ID
  static async getProductById(id, includeVariants = true) {
    const include = {
      productVariants: includeVariants ? {
        where: { isActive: true },
        orderBy: { name: 'asc' }
      } : false,
      orderItems: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          createdAt: true,
          order: {
            select: {
              orderNumber: true,
              status: true
            }
          }
        }
      }
    };

    return await prisma.product.findUnique({
      where: { id },
      include
    });
  }

  // Obtenir un produit par SKU
  static async getProductBySku(sku) {
    return await prisma.product.findUnique({
      where: { sku },
      include: {
        productVariants: {
          where: { isActive: true }
        }
      }
    });
  }

  // Lister les produits avec filtres
  static async getProducts(filters = {}) {
    const where = {
      isActive: filters.isActive !== undefined ? filters.isActive : true,
      ...(filters.category && { category: filters.category }),
      ...(filters.subcategory && { subcategory: filters.subcategory }),
      ...(filters.lowStock && { 
        stock: { 
          lte: prisma.product.fields.minStock 
        }
      }),
      ...(filters.outOfStock && { stock: 0 }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } }
        ]
      }),
      ...(filters.minPrice && filters.maxPrice && {
        price: {
          gte: filters.minPrice,
          lte: filters.maxPrice
        }
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          _count: {
            select: { orderItems: true }
          },
          productVariants: {
            where: { isActive: true },
            take: 3
          }
        },
        orderBy: {
          [filters.sortBy || 'name']: filters.sortOrder || 'asc'
        },
        skip: filters.skip || 0,
        take: filters.limit || 50
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      total,
      page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 50))
    };
  }

  // Mettre à jour un produit
  static async updateProduct(id, updateData, userId) {
    // Vérifier que le produit existe
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw new Error('Produit non trouvé');
    }

    // Vérifier l'unicité du SKU si modifié
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: updateData.sku }
      });

      if (skuExists) {
        throw new Error('Ce SKU est déjà utilisé par un autre produit');
      }
    }

    const allowedUpdates = [
      'sku', 'name', 'description', 'shortDescription', 'price', 'cost',
      'category', 'subcategory', 'color', 'size', 'material', 'stock',
      'minStock', 'maxStock', 'image', 'images', 'isActive'
    ];

    const dataToUpdate = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'images' && Array.isArray(updateData[field])) {
          dataToUpdate[field] = updateData[field];
        } else {
          dataToUpdate[field] = updateData[field];
        }
      }
    });

    dataToUpdate.updatedAt = new Date();

    const product = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: {
        productVariants: true
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PRODUCT_UPDATED',
        entityType: 'Product',
        entityId: id,
        details: {
          updatedFields: Object.keys(dataToUpdate),
          sku: product.sku,
          name: product.name
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Produit mis à jour: ${product.name} (ID: ${id}) par userId: ${userId}`);

    return product;
  }

  // Supprimer un produit (soft delete)
  static async deleteProduct(id, userId) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          where: {
            order: {
              status: {
                in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
              }
            }
          }
        }
      }
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    // Vérifier s'il est utilisé dans des commandes actives
    if (product.orderItems.length > 0) {
      throw new Error('Impossible de supprimer un produit utilisé dans des commandes actives');
    }

    // Soft delete: marquer comme inactif
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Désactiver également les variantes
    await prisma.productVariant.updateMany({
      where: { productId: id },
      data: { isActive: false }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PRODUCT_DELETED',
        entityType: 'Product',
        entityId: id,
        details: {
          sku: product.sku,
          name: product.name
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Produit supprimé (soft): ${product.name} (ID: ${id}) par userId: ${userId}`);

    return updatedProduct;
  }

  // Ajouter une variante
  static async addVariant(productId, variantData, userId) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    // Vérifier l'unicité du SKU
    if (variantData.sku) {
      const existingVariant = await prisma.productVariant.findUnique({
        where: { sku: variantData.sku }
      });

      if (existingVariant) {
        throw new Error('Une variante avec ce SKU existe déjà');
      }
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: variantData.sku || `${product.sku}-V${Math.random().toString(36).substr(2, 4)}`,
        name: variantData.name || product.name,
        price: variantData.price || product.price,
        stock: variantData.stock || 0,
        attributes: variantData.attributes || {},
        image: variantData.image,
        isActive: variantData.isActive !== undefined ? variantData.isActive : true
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'VARIANT_ADDED',
        entityType: 'Product',
        entityId: productId,
        details: {
          variantId: variant.id,
          variantName: variant.name
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    return variant;
  }

  // Mettre à jour une variante
  static async updateVariant(variantId, updateData, userId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!variant) {
      throw new Error('Variante non trouvée');
    }

    // Vérifier l'unicité du SKU si modifié
    if (updateData.sku && updateData.sku !== variant.sku) {
      const skuExists = await prisma.productVariant.findUnique({
        where: { sku: updateData.sku }
      });

      if (skuExists) {
        throw new Error('Ce SKU est déjà utilisé par une autre variante');
      }
    }

    const allowedUpdates = ['sku', 'name', 'price', 'stock', 'attributes', 'image', 'isActive'];
    const dataToUpdate = {};
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    });

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: dataToUpdate
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'VARIANT_UPDATED',
        entityType: 'Product',
        entityId: variant.productId,
        details: {
          variantId: variantId,
          updatedFields: Object.keys(dataToUpdate)
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    return updatedVariant;
  }

  // Supprimer une variante
  static async deleteVariant(variantId, userId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { 
        product: true,
        orderItems: {
          where: {
            order: {
              status: {
                in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
              }
            }
          }
        }
      }
    });

    if (!variant) {
      throw new Error('Variante non trouvée');
    }

    // Vérifier s'il est utilisé dans des commandes actives
    if (variant.orderItems.length > 0) {
      throw new Error('Impossible de supprimer une variante utilisée dans des commandes actives');
    }

    await prisma.productVariant.delete({
      where: { id: variantId }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'VARIANT_DELETED',
        entityType: 'Product',
        entityId: variant.productId,
        details: {
          variantId: variantId,
          variantName: variant.name
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    return { success: true, message: 'Variante supprimée' };
  }

  // Mettre à jour le stock
  static async updateStock(productId, quantityChange, reason, userId, reference = null) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    const newStock = product.stock + quantityChange;
    
    if (newStock < 0) {
      throw new Error('Stock insuffisant');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        updatedAt: new Date()
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'STOCK_UPDATED',
        entityType: 'Product',
        entityId: productId,
        details: {
          previousStock: product.stock,
          newStock: newStock,
          quantityChange: quantityChange,
          reason: reason,
          reference: reference
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    // Vérifier si le stock est bas
    if (newStock <= product.minStock) {
      logger.warn(`Stock bas pour produit: ${product.name} (ID: ${productId}) - Stock: ${newStock}, Min: ${product.minStock}`);
    }

    return updatedProduct;
  }

  // Obtenir les statistiques des produits
  static async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      topSellingProducts,
      categories
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: {
            lte: prisma.product.fields.minStock,
            gt: 0
          }
        }
      }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: 0
        }
      }),
      prisma.product.aggregate({
        where: { isActive: true },
        _sum: {
          stock: true
        }
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { orderItems: true }
          },
          orderItems: {
            select: {
              quantity: true
            }
          }
        },
        take: 10,
        orderBy: {
          orderItems: {
            _count: 'desc'
          }
        }
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { isActive: true }
      })
    ]);

    // Calculer la valeur totale du stock
    const stockValue = await prisma.product.aggregate({
      where: { isActive: true },
      _sum: {
        stock: true
      }
    }).then(result => result._sum.stock || 0);

    // Formater les produits les plus vendus
    const formattedTopSelling = topSellingProducts.map(product => {
      const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        stock: product.stock,
        totalSold: totalSold,
        orderCount: product._count.orderItems
      };
    }).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

    return {
      totals: {
        all: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        stockValue: stockValue
      },
      categories: categories.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {}),
      topSelling: formattedTopSelling
    };
  }

  // Rechercher des produits
  static async searchProducts(query, limit = 10) {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        category: true,
        subcategory: true,
        stock: true,
        image: true,
        productVariants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            attributes: true
          }
        }
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });
  }

  // Obtenir les produits avec stock bas
  static async getLowStockProducts(threshold = null) {
    const where = {
      isActive: true,
      stock: {
        lte: threshold !== null ? threshold : prisma.product.fields.minStock,
        gt: 0
      }
    };

    return await prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        stock: true,
        minStock: true,
        price: true,
        image: true
      },
      orderBy: {
        stock: 'asc'
      }
    });
  }

  // Obtenir les produits épuisés
  static async getOutOfStockProducts() {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        stock: 0
      },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        price: true,
        image: true,
        minStock: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }
}

module.exports = Product;
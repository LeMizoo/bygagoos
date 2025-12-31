// backend/models/Client.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../middleware/logger');

class Client {
  // Créer un nouveau client
  static async createClient(clientData, userId) {
    try {
      // Vérifier si l'email existe déjà
      if (clientData.email) {
        const existingClient = await prisma.client.findUnique({
          where: { email: clientData.email }
        });

        if (existingClient) {
          throw new Error('Un client avec cet email existe déjà');
        }
      }

      const client = await prisma.client.create({
        data: {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          phone2: clientData.phone2,
          address: clientData.address,
          city: clientData.city,
          company: clientData.company,
          taxId: clientData.taxId,
          clientType: clientData.clientType || 'INDIVIDUAL',
          status: clientData.status || 'ACTIVE',
          notes: clientData.notes,
          totalSpent: 0,
          totalOrders: 0
        },
        include: {
          contacts: true
        }
      });

      // Ajouter des contacts si fournis
      if (clientData.contacts && clientData.contacts.length > 0) {
        for (const contactData of clientData.contacts) {
          await prisma.contactPerson.create({
            data: {
              clientId: client.id,
              name: contactData.name,
              email: contactData.email,
              phone: contactData.phone,
              position: contactData.position,
              isPrimary: contactData.isPrimary || false,
              notes: contactData.notes
            }
          });
        }
      }

      // Log d'activité
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'CLIENT_CREATED',
          entityType: 'Client',
          entityId: client.id,
          details: {
            name: client.name,
            email: client.email,
            clientType: client.clientType
          },
          ipAddress: 'system',
          userAgent: 'BYGAGOOS_API'
        }
      });

      logger.info(`Nouveau client créé: ${client.name} par userId: ${userId}`);

      return client;

    } catch (error) {
      logger.error(`Erreur création client: ${error.message}`);
      throw error;
    }
  }

  // Obtenir un client par ID
  static async getClientById(id, includeRelations = true) {
    const include = {
      contacts: true,
      orders: includeRelations ? {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          createdAt: true,
          deadline: true
        }
      } : false
    };

    return await prisma.client.findUnique({
      where: { id },
      include
    });
  }

  // Obtenir un client par email
  static async getClientByEmail(email) {
    return await prisma.client.findUnique({
      where: { email },
      include: {
        contacts: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        }
      }
    });
  }

  // Lister les clients avec filtres
  static async getClients(filters = {}) {
    const where = {
      ...(filters.status && { status: filters.status }),
      ...(filters.clientType && { clientType: filters.clientType }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { company: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } }
        ]
      }),
      ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
      ...(filters.minOrders && { totalOrders: { gte: filters.minOrders } }),
      ...(filters.minSpent && { totalSpent: { gte: filters.minSpent } })
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { orders: true }
          },
          contacts: {
            where: { isPrimary: true },
            take: 1
          }
        },
        orderBy: {
          [filters.sortBy || 'name']: filters.sortOrder || 'asc'
        },
        skip: filters.skip || 0,
        take: filters.limit || 50
      }),
      prisma.client.count({ where })
    ]);

    return {
      clients,
      total,
      page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 50))
    };
  }

  // Mettre à jour un client
  static async updateClient(id, updateData, userId) {
    // Vérifier que le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      throw new Error('Client non trouvé');
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateData.email && updateData.email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: updateData.email }
      });

      if (emailExists) {
        throw new Error('Cet email est déjà utilisé par un autre client');
      }
    }

    const allowedUpdates = [
      'name', 'email', 'phone', 'phone2', 'address', 'city',
      'company', 'taxId', 'clientType', 'status', 'notes'
    ];

    const dataToUpdate = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    });

    dataToUpdate.updatedAt = new Date();

    const client = await prisma.client.update({
      where: { id },
      data: dataToUpdate,
      include: {
        contacts: true
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CLIENT_UPDATED',
        entityType: 'Client',
        entityId: id,
        details: {
          updatedFields: Object.keys(dataToUpdate),
          previousStatus: existingClient.status,
          newStatus: client.status
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Client mis à jour: ${client.name} (ID: ${id}) par userId: ${userId}`);

    return client;
  }

  // Supprimer un client (soft delete via statut)
  static async deleteClient(id, userId, reason = '') {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
            }
          }
        }
      }
    });

    if (!client) {
      throw new Error('Client non trouvé');
    }

    // Vérifier s'il y a des commandes actives
    if (client.orders.length > 0) {
      throw new Error('Impossible de supprimer un client avec des commandes actives');
    }

    // Marquer comme inactif au lieu de supprimer
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date()
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CLIENT_DEACTIVATED',
        entityType: 'Client',
        entityId: id,
        details: {
          reason,
          previousStatus: client.status,
          name: client.name
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    logger.info(`Client désactivé: ${client.name} (ID: ${id}) par userId: ${userId}`);

    return updatedClient;
  }

  // Ajouter un contact
  static async addContact(clientId, contactData, userId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      throw new Error('Client non trouvé');
    }

    // Si c'est un contact principal, désactiver les autres
    if (contactData.isPrimary) {
      await prisma.contactPerson.updateMany({
        where: { 
          clientId,
          isPrimary: true 
        },
        data: { isPrimary: false }
      });
    }

    const contact = await prisma.contactPerson.create({
      data: {
        clientId,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        position: contactData.position,
        isPrimary: contactData.isPrimary || false,
        notes: contactData.notes
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CONTACT_ADDED',
        entityType: 'Client',
        entityId: clientId,
        details: {
          contactName: contact.name,
          contactId: contact.id
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    return contact;
  }

  // Mettre à jour un contact
  static async updateContact(contactId, updateData, userId) {
    const contact = await prisma.contactPerson.findUnique({
      where: { id: contactId },
      include: { client: true }
    });

    if (!contact) {
      throw new Error('Contact non trouvé');
    }

    // Si on définit comme principal, désactiver les autres
    if (updateData.isPrimary === true) {
      await prisma.contactPerson.updateMany({
        where: { 
          clientId: contact.clientId,
          isPrimary: true,
          id: { not: contactId }
        },
        data: { isPrimary: false }
      });
    }

    const allowedUpdates = ['name', 'email', 'phone', 'position', 'isPrimary', 'notes'];
    const dataToUpdate = {};
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    });

    dataToUpdate.updatedAt = new Date();

    const updatedContact = await prisma.contactPerson.update({
      where: { id: contactId },
      data: dataToUpdate
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CONTACT_UPDATED',
        entityType: 'Client',
        entityId: contact.clientId,
        details: {
          contactId: contactId,
          updatedFields: Object.keys(dataToUpdate)
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    return updatedContact;
  }

  // Supprimer un contact
  static async deleteContact(contactId, userId) {
    const contact = await prisma.contactPerson.findUnique({
      where: { id: contactId },
      include: { client: true }
    });

    if (!contact) {
      throw new Error('Contact non trouvé');
    }

    await prisma.contactPerson.delete({
      where: { id: contactId }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CONTACT_DELETED',
        entityType: 'Client',
        entityId: contact.clientId,
        details: {
          contactName: contact.name,
          contactId: contactId
        },
        ipAddress: 'system',
        userAgent: 'BYGAGOOS_API'
      }
    });

    return { success: true, message: 'Contact supprimé' };
  }

  // Obtenir les statistiques des clients
  static async getClientStats() {
    const [
      totalClients,
      activeClients,
      companyClients,
      individualClients,
      topSpenders,
      recentClients,
      averageOrdersPerClient,
      averageSpentPerClient
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.client.count({ where: { clientType: 'COMPANY' } }),
      prisma.client.count({ where: { clientType: 'INDIVIDUAL' } }),
      prisma.client.findMany({
        where: { 
          status: 'ACTIVE',
          totalSpent: { gt: 0 }
        },
        orderBy: { totalSpent: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          company: true,
          totalSpent: true,
          totalOrders: true,
          lastOrderDate: true
        }
      }),
      prisma.client.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          createdAt: true
        }
      }),
      prisma.client.aggregate({
        where: { status: 'ACTIVE' },
        _avg: { totalOrders: true }
      }),
      prisma.client.aggregate({
        where: { 
          status: 'ACTIVE',
          totalSpent: { gt: 0 }
        },
        _avg: { totalSpent: true }
      })
    ]);

    // Répartition par type de client
    const clientTypeDistribution = await prisma.client.groupBy({
      by: ['clientType'],
      _count: { id: true },
      where: { status: 'ACTIVE' }
    });

    // Clients sans commandes
    const clientsWithoutOrders = await prisma.client.count({
      where: {
        status: 'ACTIVE',
        totalOrders: 0
      }
    });

    return {
      totals: {
        all: totalClients,
        active: activeClients,
        inactive: totalClients - activeClients,
        companies: companyClients,
        individuals: individualClients,
        withoutOrders: clientsWithoutOrders
      },
      averages: {
        ordersPerClient: averageOrdersPerClient._avg.totalOrders || 0,
        spentPerClient: averageSpentPerClient._avg.totalSpent || 0
      },
      distribution: {
        clientType: clientTypeDistribution.reduce((acc, item) => {
          acc[item.clientType] = item._count.id;
          return acc;
        }, {})
      },
      topSpenders,
      recentClients
    };
  }

  // Rechercher des clients
  static async searchClients(query, limit = 10) {
    return await prisma.client.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        clientType: true,
        totalSpent: true,
        totalOrders: true
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });
  }

  // Obtenir l'historique des commandes d'un client
  static async getClientOrderHistory(clientId, filters = {}) {
    const where = {
      clientId,
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate && filters.endDate && {
        createdAt: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        }
      })
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          createdAt: true,
          deadline: true,
          deliveredAt: true,
          orderItems: {
            select: {
              id: true,
              name: true,
              quantity: true,
              totalPrice: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: filters.skip || 0,
        take: filters.limit || 20
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      total,
      page: Math.floor((filters.skip || 0) / (filters.limit || 20)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 20))
    };
  }
}

module.exports = Client;
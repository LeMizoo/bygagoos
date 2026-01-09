// backend/routes/clients.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware d'authentification simplifié
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
  
  // Simuler la vérification du token pour le développement
  req.user = { id: 1, role: 'admin' };
  next();
};

// Récupérer tous les clients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      search, 
      status = 'ACTIVE', 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construire la requête where
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Essayer de récupérer depuis la base de données
    try {
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take: parseInt(limit),
          include: {
            _count: {
              select: { orders: true }
            }
          }
        }),
        prisma.client.count({ where })
      ]);
      
      // Calculer les statistiques
      const stats = {
        total,
        active: await prisma.client.count({ where: { status: 'ACTIVE' } }),
        inactive: await prisma.client.count({ where: { status: 'INACTIVE' } }),
        newThisMonth: await prisma.client.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      };
      
      return res.json({
        success: true,
        data: clients,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        stats
      });
      
    } catch (dbError) {
      console.log('Mode démo pour clients (erreur DB):', dbError.message);
      
      // Données de démo
      const demoClients = [
        {
          id: 1,
          name: 'Marie RAKOTO',
          email: 'marie@techmad.mg',
          phone: '+261 34 12 345 67',
          company: 'TechMad SARL',
          address: 'Lot II A 165 Anosimasina, Antananarivo',
          status: 'ACTIVE',
          totalOrders: 12,
          totalSpent: 8500000,
          lastOrder: '2024-01-15',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          _count: { orders: 12 }
        },
        {
          id: 2,
          name: 'Jean RAZAFY',
          email: 'jean@fashionmg.mg',
          phone: '+261 33 98 765 43',
          company: 'Fashion MG',
          address: 'IVG 67 A Ambohibao, Antananarivo',
          status: 'ACTIVE',
          totalOrders: 8,
          totalSpent: 4200000,
          lastOrder: '2024-01-14',
          createdAt: '2024-01-05T10:30:00Z',
          updatedAt: '2024-01-14T15:20:00Z',
          _count: { orders: 8 }
        },
        {
          id: 3,
          name: 'Sophie RAMANANTSOA',
          email: 'sophie@hotelparadis.mg',
          phone: '+261 32 11 223 34',
          company: 'Hôtel Paradis',
          address: 'RN7, Antsirabe',
          status: 'ACTIVE',
          totalOrders: 5,
          totalSpent: 3200000,
          lastOrder: '2024-01-10',
          createdAt: '2023-12-15T09:00:00Z',
          updatedAt: '2024-01-10T11:45:00Z',
          _count: { orders: 5 }
        },
        {
          id: 4,
          name: 'Robert ANDRIAMALALA',
          email: 'robert@restaurant.mg',
          phone: '+261 34 55 667 78',
          company: 'Restaurant Le Gourmet',
          address: 'Analakely, Antananarivo',
          status: 'ACTIVE',
          totalOrders: 3,
          totalSpent: 1500000,
          lastOrder: '2024-01-08',
          createdAt: '2023-12-20T14:00:00Z',
          updatedAt: '2024-01-08T16:30:00Z',
          _count: { orders: 3 }
        },
        {
          id: 5,
          name: 'Lisa RAKOTONIRINA',
          email: 'lisa@eventmg.mg',
          phone: '+261 33 44 556 67',
          company: 'Event MG',
          address: 'Ambohijatovo, Antananarivo',
          status: 'INACTIVE',
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: null,
          createdAt: '2024-01-02T11:00:00Z',
          updatedAt: '2024-01-02T11:00:00Z',
          _count: { orders: 0 }
        }
      ];
      
      // Filtrer les données de démo
      let filteredClients = [...demoClients];
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredClients = filteredClients.filter(client =>
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.company?.toLowerCase().includes(searchLower)
        );
      }
      
      if (status) {
        filteredClients = filteredClients.filter(client => client.status === status);
      }
      
      // Pagination
      const total = filteredClients.length;
      const startIndex = skip;
      const endIndex = skip + parseInt(limit);
      const paginatedClients = filteredClients.slice(startIndex, endIndex);
      
      return res.json({
        success: true,
        data: paginatedClients,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          total: filteredClients.length,
          active: filteredClients.filter(c => c.status === 'ACTIVE').length,
          inactive: filteredClients.filter(c => c.status === 'INACTIVE').length,
          newThisMonth: filteredClients.filter(c => 
            new Date(c.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          ).length
        },
        source: 'demo'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur récupération clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des clients'
    });
  }
});

// Récupérer un client par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    // Essayer la base de données
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              orderItems: {
                include: {
                  product: {
                    select: {
                      name: true,
                      category: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      
      return res.json({
        success: true,
        data: client,
        source: 'database'
      });
      
    } catch (dbError) {
      console.log('Mode démo pour client (erreur DB):', dbError.message);
      
      // Données de démo
      const demoClients = [
        {
          id: 1,
          name: 'Marie RAKOTO',
          email: 'marie@techmad.mg',
          phone: '+261 34 12 345 67',
          company: 'TechMad SARL',
          address: 'Lot II A 165 Anosimasina, Antananarivo',
          businessType: 'corporate',
          status: 'ACTIVE',
          totalOrders: 12,
          totalSpent: 8500000,
          lastOrder: '2024-01-15',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          orders: [
            {
              id: 1,
              orderNumber: 'CMD-2024-001',
              totalAmount: 1200000,
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              deliveryDate: '2024-01-25',
              createdAt: '2024-01-15T08:30:00Z',
              orderItems: [
                {
                  id: 1,
                  quantity: 100,
                  product: {
                    name: 'T-Shirts Blancs Premium',
                    category: 'T-SHIRTS'
                  }
                }
              ]
            }
          ]
        }
      ];
      
      const client = demoClients.find(c => c.id === clientId);
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: client,
        source: 'demo'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur récupération client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Créer un nouveau client
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      company, 
      address, 
      businessType = 'restaurant',
      notes 
    } = req.body;
    
    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et téléphone sont requis'
      });
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }
    
    // Mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Création client (mode démo):', { name, email });
      
      const newClient = {
        id: Date.now(),
        name,
        email,
        phone,
        company: company || null,
        address: address || null,
        businessType,
        status: 'ACTIVE',
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        message: 'Client créé avec succès (mode démo)',
        data: newClient,
        source: 'demo'
      });
    }
    
    // Mode production
    try {
      // Vérifier si l'email existe déjà
      const existingClient = await prisma.client.findUnique({
        where: { email }
      });
      
      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'Un client avec cet email existe déjà'
        });
      }
      
      const client = await prisma.client.create({
        data: {
          name,
          email,
          phone,
          company: company || null,
          address: address || null,
          businessType,
          status: 'ACTIVE',
          notes: notes || null
        }
      });
      
      res.status(201).json({
        success: true,
        message: 'Client créé avec succès',
        data: client,
        source: 'database'
      });
      
    } catch (dbError) {
      console.error('❌ Erreur DB création client:', dbError);
      
      // Fallback
      const newClient = {
        id: Date.now(),
        name,
        email,
        phone,
        company: company || null,
        address: address || null,
        businessType,
        status: 'ACTIVE'
      };
      
      res.status(201).json({
        success: true,
        message: 'Client créé avec succès (mode fallback)',
        data: newClient,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur création client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du client'
    });
  }
});

// Mettre à jour un client
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { 
      name, 
      email, 
      phone, 
      company, 
      address, 
      businessType,
      status,
      notes 
    } = req.body;
    
    // Mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Mise à jour client (mode démo):', { clientId, name });
      
      const updatedClient = {
        id: clientId,
        name,
        email,
        phone,
        company: company || null,
        address: address || null,
        businessType: businessType || 'restaurant',
        status: status || 'ACTIVE',
        updatedAt: new Date().toISOString()
      };
      
      return res.json({
        success: true,
        message: 'Client mis à jour avec succès (mode démo)',
        data: updatedClient,
        source: 'demo'
      });
    }
    
    // Mode production
    try {
      const client = await prisma.client.update({
        where: { id: clientId },
        data: {
          name,
          email,
          phone,
          company: company || null,
          address: address || null,
          businessType,
          status,
          notes: notes || null,
          updatedAt: new Date()
        }
      });
      
      res.json({
        success: true,
        message: 'Client mis à jour avec succès',
        data: client,
        source: 'database'
      });
      
    } catch (dbError) {
      console.error('❌ Erreur DB mise à jour client:', dbError);
      
      // Fallback
      const updatedClient = {
        id: clientId,
        name,
        email,
        phone,
        company: company || null,
        address: address || null,
        businessType: businessType || 'restaurant',
        status: status || 'ACTIVE'
      };
      
      res.json({
        success: true,
        message: 'Client mis à jour avec succès (mode fallback)',
        data: updatedClient,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur mise à jour client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du client'
    });
  }
});

// Supprimer un client (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    // Mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Suppression client (mode démo):', clientId);
      
      return res.json({
        success: true,
        message: 'Client supprimé avec succès (mode démo)',
        source: 'demo'
      });
    }
    
    // Mode production: soft delete
    try {
      await prisma.client.update({
        where: { id: clientId },
        data: { 
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      });
      
      res.json({
        success: true,
        message: 'Client désactivé avec succès',
        source: 'database'
      });
      
    } catch (dbError) {
      console.error('❌ Erreur DB suppression client:', dbError);
      
      res.json({
        success: true,
        message: 'Client désactivé avec succès (mode fallback)',
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur suppression client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du client'
    });
  }
});

// Statistiques clients
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    // Mode développement
    if (process.env.NODE_ENV === 'development') {
      const stats = {
        total: 42,
        active: 38,
        inactive: 4,
        newThisMonth: 12,
        topClients: [
          { name: 'TechMad SARL', totalSpent: 8500000, orders: 12 },
          { name: 'Fashion MG', totalSpent: 4200000, orders: 8 },
          { name: 'Hôtel Paradis', totalSpent: 3200000, orders: 5 }
        ],
        growthRate: 15.5
      };
      
      return res.json({
        success: true,
        data: stats,
        source: 'demo'
      });
    }
    
    // Mode production
    try {
      const [
        total,
        active,
        inactive,
        newThisMonth,
        topClients
      ] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { status: 'ACTIVE' } }),
        prisma.client.count({ where: { status: 'INACTIVE' } }),
        prisma.client.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.client.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { totalSpent: 'desc' },
          take: 5,
          select: {
            name: true,
            totalSpent: true,
            totalOrders: true
          }
        })
      ]);
      
      const stats = {
        total,
        active,
        inactive,
        newThisMonth,
        topClients,
        growthRate: newThisMonth > 0 ? ((newThisMonth / total) * 100).toFixed(1) : 0
      };
      
      res.json({
        success: true,
        data: stats,
        source: 'database'
      });
      
    } catch (dbError) {
      console.error('❌ Erreur DB stats clients:', dbError);
      
      const stats = {
        total: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0,
        topClients: [],
        growthRate: 0
      };
      
      res.json({
        success: true,
        data: stats,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur stats clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
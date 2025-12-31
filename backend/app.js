// backend/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques - IMPORTANT: Chemin corrigé
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORRECTION : Servir le dossier public à la racine de /api/images
app.use('/api/images', express.static(path.join(__dirname, 'public', 'images')));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend ByGagoos Ink en ligne',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV
  });
});

// Import des routes
const ordersRoutes = require('./routes/orders');
const productionRoutes = require('./routes/production');

// Route publique pour la galerie d'images
app.get('/api/public/gallery', async (req, res) => {
  try {
    const galleryImages = [
      // Équipe familiale (profiles/)
      {
        id: 1,
        url: '/api/images/profiles/miantsatiana.jpg',
        thumbnail: '/api/images/profiles/miantsatiana.jpg',
        title: 'Miantso',
        category: 'team',
        description: 'Directeur & Designer principal - Fondateur de ByGagoos Ink',
        role: 'Directeur Artistique'
      },
      {
        id: 2,
        url: '/api/images/profiles/tia-faniry.jpg',
        thumbnail: '/api/images/profiles/tia-faniry.jpg',
        title: 'Faniry',
        category: 'team',
        description: 'Gestion de production & Relations clients',
        role: 'Responsable Production'
      },
      {
        id: 3,
        url: '/api/images/profiles/tovoniaina.jpg',
        thumbnail: '/api/images/profiles/tovoniaina.jpg',
        title: 'Tovoniaina',
        category: 'team',
        description: 'Expert technique en sérigraphie',
        role: 'Technicien Sérigraphie'
      },
      {
        id: 4,
        url: '/api/images/profiles/volatiana.jpg',
        thumbnail: '/api/images/profiles/volatiana.jpg',
        title: 'Volatiana',
        category: 'team',
        description: 'Logistique & Administration',
        role: 'Responsable Logistique'
      },
      
      // Atelier de production (production/)
      {
        id: 5,
        url: '/api/images/production/atelier-serigraphie.jpg',
        thumbnail: '/api/images/production/atelier-serigraphie.jpg',
        title: 'Notre Atelier',
        category: 'production',
        description: 'Espace de création où la magie opère',
        details: 'Machines professionnelles & environnement contrôlé'
      },
      {
        id: 6,
        url: '/api/images/production/equipe-serigraphie.jpg',
        thumbnail: '/api/images/production/equipe-serigraphie.jpg',
        title: 'Équipe en Action',
        category: 'production',
        description: 'Précision et expertise à chaque étape',
        details: 'Processus qualité rigoureux'
      },
      {
        id: 7,
        url: '/api/images/production/marcel-prod.jpg',
        thumbnail: '/api/images/production/marcel-prod.jpg',
        title: 'Expertise Technique',
        category: 'production',
        description: 'Maitrise des techniques avancées',
        details: 'Formation continue & innovation'
      },
      {
        id: 8,
        url: '/api/images/production/equipe-prod-02.jpg',
        thumbnail: '/api/images/production/equipe-prod-02.jpg',
        title: 'Contrôle Qualité',
        category: 'production',
        description: 'Vérification minutieuse de chaque pièce',
        details: 'Double vérification avant expédition'
      },
      
      // Images générales (images/)
      {
        id: 9,
        url: '/api/images/team-family.jpg',
        thumbnail: '/api/images/team-family.jpg',
        title: 'L\'Esprit Familial',
        category: 'team',
        description: 'Plus qu\'une entreprise, une famille',
        details: 'Cohésion & valeurs partagées'
      },
      {
        id: 10,
        url: '/api/images/inauguration.jpg',
        thumbnail: '/api/images/inauguration.jpg',
        title: 'Inauguration',
        category: 'events',
        description: 'Début de notre aventure',
        details: '2010 - Lancement officiel'
      },
      {
        id: 11,
        url: '/api/images/bygagoos-large.png',
        thumbnail: '/api/images/bygagoos-large.png',
        title: 'Notre Identité Visuelle',
        category: 'creations',
        description: 'Logo ByGagoos Ink - Version complète',
        details: 'Design : Miantso, 2010'
      },
      {
        id: 12,
        url: '/api/images/logo.png',
        thumbnail: '/api/images/logo.png',
        title: 'Logo ByGagoos Ink',
        category: 'creations',
        description: 'Notre signature',
        details: 'Symbole de qualité et de tradition'
      }
    ];
    
    // Catégories disponibles
    const categories = [
      { id: 'all', name: 'Toutes les images' },
      { id: 'team', name: 'L\'Équipe Familiale' },
      { id: 'production', name: 'Atelier de Production' },
      { id: 'creations', name: 'Nos Créations' },
      { id: 'events', name: 'Événements' }
    ];
    
    // Statistiques de l'entreprise
    const companyStats = {
      yearsExperience: 15,
      satisfiedClients: 1000,
      familyMembers: 4,
      uniqueCreations: '∞',
      established: 2010,
      location: 'Antananarivo, Madagascar'
    };
    
    // Informations de contact
    const contactInfo = {
      phone: '+261 34 XX XX XX',
      email: 'contact@bygagoos-ink.mg',
      address: 'Antananarivo, Madagascar',
      motto: 'Une famille, une passion, un métier'
    };
    
    res.json({
      success: true,
      data: {
        images: galleryImages,
        categories: categories,
        stats: companyStats,
        contact: contactInfo,
        metadata: {
          totalImages: galleryImages.length,
          lastUpdated: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur gallery API:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des images',
      error: NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route publique pour les informations de l'entreprise
app.get('/api/public/company-info', async (req, res) => {
  try {
    const companyInfo = {
      name: 'ByGagoos Ink',
      tagline: 'Sérigraphie Textile d\'Excellence • Depuis 2010',
      description: 'Une entreprise familiale malgache spécialisée dans la création textile sur mesure. L\'art de l\'impression rencontre l\'âme du Madagascar.',
      history: {
        founded: 2010,
        founder: 'Miantso',
        story: 'Fondée en 2010 par Miantso, ByGagoos Ink est née d\'une passion pour l\'artisanat textile et d\'un désir de créer une entreprise familiale durable à Madagascar. Ce qui a commencé comme un petit atelier avec une seule machine de sérigraphie est devenu une référence dans la création textile personnalisée, combinant techniques traditionnelles et innovations modernes.'
      },
      values: [
        'Qualité artisanale',
        'Approche familiale',
        'Innovation durable',
        'Service personnalisé',
        'Fierté malgache'
      ],
      services: [
        'Sérigraphie textile',
        'Impression numérique',
        'Broderie',
        'Conception graphique',
        'Production sur mesure'
      ],
      team: [
        {
          name: 'Miantso',
          role: 'Directeur & Designer principal',
          description: 'Fondateur et directeur artistique de ByGagoos Ink',
          image: '/api/images/profiles/miantsatiana.jpg'
        },
        {
          name: 'Faniry',
          role: 'Responsable Production',
          description: 'Gestion de production & Relations clients',
          image: '/api/images/profiles/tia-faniry.jpg'
        },
        {
          name: 'Tovoniaina',
          role: 'Technicien Sérigraphie',
          description: 'Expert technique en sérigraphie',
          image: '/api/images/profiles/tovoniaina.jpg'
        },
        {
          name: 'Volatiana',
          role: 'Responsable Logistique',
          description: 'Logistique & Administration',
          image: '/api/images/profiles/volatiana.jpg'
        }
      ]
    };
    
    res.json({
      success: true,
      data: companyInfo
    });
    
  } catch (error) {
    console.error('❌ Erreur company info API:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations'
    });
  }
});

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('🔐 Tentative de login:', { username, email });
    
    // Validation
    const identifier = username || email;
    
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant et mot de passe sont requis'
      });
    }
    
    // Utilisateurs avec les vraies images de profils
    const validUsers = [
      {
        identifier: 'miantsatiana@bygagoos.mg',
        password: 'demo123',
        userData: {
          id: 1,
          email: 'miantsatiana@bygagoos.mg',
          username: 'miantsatiana',
          name: 'Miantso',
          role: 'super_admin',
          avatar: '/api/images/profiles/miantsatiana.jpg',
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_all'],
          company: 'ByGagoos Ink',
          department: 'Direction',
          familyRole: 'Fondateur & Designer'
        }
      },
      {
        identifier: 'tiafaniry@bygagoos.mg',
        password: 'demo123',
        userData: {
          id: 2,
          email: 'tiafaniry@bygagoos.mg',
          username: 'tiafaniry',
          name: 'Faniry',
          role: 'admin',
          avatar: '/api/images/profiles/tia-faniry.jpg',
          permissions: ['read', 'write', 'manage_orders', 'manage_production'],
          company: 'ByGagoos Ink',
          department: 'Production',
          familyRole: 'Responsable Production'
        }
      },
      {
        identifier: 'tovoniaina@bygagoos.mg',
        password: 'demo123',
        userData: {
          id: 3,
          email: 'tovoniaina@bygagoos.mg',
          username: 'tovoniaina',
          name: 'Tovoniaina',
          role: 'production_manager',
          avatar: '/api/images/profiles/tovoniaina.jpg',
          permissions: ['read', 'write', 'manage_production'],
          company: 'ByGagoos Ink',
          department: 'Atelier',
          familyRole: 'Technicien Sérigraphie'
        }
      },
      {
        identifier: 'volatiana@bygagoos.mg',
        password: 'demo123',
        userData: {
          id: 4,
          email: 'volatiana@bygagoos.mg',
          username: 'volatiana',
          name: 'Volatiana',
          role: 'logistics_manager',
          avatar: '/api/images/profiles/volatiana.jpg',
          permissions: ['read', 'write', 'manage_logistics'],
          company: 'ByGagoos Ink',
          department: 'Logistique',
          familyRole: 'Responsable Logistique'
        }
      },
      {
        identifier: 'demo@bygagoos.mg',
        password: 'demo123',
        userData: {
          id: 5,
          email: 'demo@bygagoos.mg',
          username: 'demo',
          name: 'Utilisateur Démo',
          role: 'user',
          avatar: null,
          permissions: ['read'],
          company: 'ByGagoos Ink',
          department: 'Ventes',
          familyRole: 'Collaborateur'
        }
      }
    ];
    
    const validUser = validUsers.find(u => 
      u.identifier === identifier && u.password === password
    );
    
    if (!validUser) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
    
    // Générer un token JWT simulé
    const token = `jwt-${Date.now()}-${validUser.userData.id}`;
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: validUser.userData
    });
    
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route d'inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    
    // Simuler la création d'utilisateur
    const newUser = {
      id: Date.now(),
      email,
      username: email.split('@')[0],
      name,
      role,
      avatar: null,
      permissions: role === 'admin' ? ['read', 'write'] : ['read'],
      company: 'ByGagoos Ink',
      createdAt: new Date().toISOString()
    };
    
    const token = `jwt-${Date.now()}-${newUser.id}`;
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: newUser
    });
    
  } catch (error) {
    console.error('❌ Erreur register:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route de vérification de token
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }
    
    // Simulation de vérification de token
    const userId = token.split('-')[2];
    
    // Simuler un utilisateur en fonction de l'ID
    const users = {
      '1': {
        id: 1,
        email: 'miantsatiana@bygagoos.mg',
        username: 'miantsatiana',
        name: 'Miantso',
        role: 'super_admin',
        avatar: '/api/images/profiles/miantsatiana.jpg',
        permissions: ['read', 'write', 'delete', 'manage_users', 'manage_all'],
        company: 'ByGagoos Ink',
        department: 'Direction'
      },
      '2': {
        id: 2,
        email: 'tiafaniry@bygagoos.mg',
        username: 'tiafaniry',
        name: 'Faniry',
        role: 'admin',
        avatar: '/api/images/profiles/tia-faniry.jpg',
        permissions: ['read', 'write', 'manage_orders', 'manage_production'],
        company: 'ByGagoos Ink',
        department: 'Production'
      },
      '3': {
        id: 3,
        email: 'tovoniaina@bygagoos.mg',
        username: 'tovoniaina',
        name: 'Tovoniaina',
        role: 'production_manager',
        avatar: '/api/images/profiles/tovoniaina.jpg',
        permissions: ['read', 'write', 'manage_production'],
        company: 'ByGagoos Ink',
        department: 'Atelier'
      },
      '4': {
        id: 4,
        email: 'volatiana@bygagoos.mg',
        username: 'volatiana',
        name: 'Volatiana',
        role: 'logistics_manager',
        avatar: '/api/images/profiles/volatiana.jpg',
        permissions: ['read', 'write', 'manage_logistics'],
        company: 'ByGagoos Ink',
        department: 'Logistique'
      }
    };
    
    const user = users[userId] || {
      id: 5,
      email: 'demo@bygagoos.mg',
      username: 'demo',
      name: 'Utilisateur Démo',
      role: 'user',
      avatar: null,
      permissions: ['read'],
      company: 'ByGagoos Ink',
      department: 'Ventes'
    };
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('❌ Erreur verify:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Routes API principales
app.use('/api/orders', ordersRoutes);
app.use('/api/production', productionRoutes);

// Routes simulées pour compatibilité
app.get('/api/clients', async (req, res) => {
  try {
    const clients = [
      {
        id: 1,
        name: 'Nike Store',
        email: 'contact@nike.com',
        phone: '+33 1 23 45 67 89',
        address: '123 Avenue du Sport, 75015 Paris',
        type: 'entreprise',
        ordersCount: 15,
        totalSpent: 25000,
        lastOrder: '2024-01-15',
        status: 'active',
        notes: 'Client fidèle - commandes régulières'
      },
      {
        id: 2,
        name: 'Adidas',
        email: 'contact@adidas.com',
        phone: '+33 1 98 76 54 32',
        address: '456 Rue de la Mode, 69002 Lyon',
        type: 'entreprise',
        ordersCount: 12,
        totalSpent: 18000,
        lastOrder: '2024-01-14',
        status: 'active',
        notes: 'Exigeant sur les délais'
      },
      {
        id: 3,
        name: 'Puma',
        email: 'contact@puma.com',
        phone: '+33 2 34 56 78 90',
        address: '789 Boulevard des Affaires, 13008 Marseille',
        type: 'entreprise',
        ordersCount: 8,
        totalSpent: 12000,
        lastOrder: '2024-01-13',
        status: 'active',
        notes: 'Paiement à 30 jours'
      },
      {
        id: 4,
        name: 'Decathlon',
        email: 'commande@decathlon.com',
        phone: '+33 3 45 67 89 01',
        address: '101 Rue du Commerce, 59000 Lille',
        type: 'entreprise',
        ordersCount: 25,
        totalSpent: 42000,
        lastOrder: '2024-01-12',
        status: 'active',
        notes: 'Plus gros client - négociation tarifs'
      },
      {
        id: 5,
        name: 'New Balance',
        email: 'orders@newbalance.com',
        phone: '+33 4 56 78 90 12',
        address: '202 Avenue de l\'Industrie, 31000 Toulouse',
        type: 'entreprise',
        ordersCount: 6,
        totalSpent: 8500,
        lastOrder: '2024-01-11',
        status: 'active',
        notes: 'Nouveau client - à fidéliser'
      }
    ];
    
    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
    
  } catch (error) {
    console.error('❌ Erreur clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour les produits
app.get('/api/products', async (req, res) => {
  try {
    const products = [
      {
        id: 1,
        name: 'T-shirt 100% Coton',
        category: 'vêtements',
        price: 12.50,
        stock: 1500,
        minStock: 200,
        supplier: 'Textile France',
        sku: 'TSH-COT-001',
        color: 'Blanc',
        sizes: ['S', 'M', 'L', 'XL'],
        lastRestock: '2024-01-10'
      },
      {
        id: 2,
        name: 'Sweat à capuche',
        category: 'vêtements',
        price: 25.00,
        stock: 800,
        minStock: 100,
        supplier: 'Premium Wear',
        sku: 'SWT-HOOD-002',
        color: 'Noir',
        sizes: ['M', 'L', 'XL'],
        lastRestock: '2024-01-08'
      },
      {
        id: 3,
        name: 'Polo Sport',
        category: 'vêtements',
        price: 15.00,
        stock: 1200,
        minStock: 150,
        supplier: 'Active Gear',
        sku: 'POLO-SPT-003',
        color: 'Bleu',
        sizes: ['S', 'M', 'L'],
        lastRestock: '2024-01-05'
      }
    ];
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
    
  } catch (error) {
    console.error('❌ Erreur products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour le stock
app.get('/api/stock', async (req, res) => {
  try {
    const stock = [
      {
        id: 1,
        product: 'Encre Blanche',
        category: 'consommables',
        quantity: 25,
        unit: 'L',
        minQuantity: 50,
        supplier: 'Ink Masters',
        lastOrder: '2024-01-05',
        status: 'low'
      },
      {
        id: 2,
        product: 'Cadres Sérigraphie 40x50',
        category: 'équipement',
        quantity: 15,
        unit: 'unités',
        minQuantity: 30,
        supplier: 'Print Tech',
        lastOrder: '2024-01-10',
        status: 'low'
      },
      {
        id: 3,
        product: 'Raclette Professionnelle',
        category: 'outils',
        quantity: 8,
        unit: 'unités',
        minQuantity: 10,
        supplier: 'Pro Tools',
        lastOrder: '2025-12-20',
        status: 'low'
      },
      {
        id: 4,
        product: 'T-shirts Blancs XL',
        category: 'produits',
        quantity: 350,
        unit: 'pièces',
        minQuantity: 500,
        supplier: 'Textile Express',
        lastOrder: '2024-01-12',
        status: 'medium'
      }
    ];
    
    res.json({
      success: true,
      count: stock.length,
      data: stock
    });
    
  } catch (error) {
    console.error('❌ Erreur stock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour les statistiques dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Utiliser les vraies données de la base
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      activeClients,
      lowStockItems
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true }
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.client.count(),
      prisma.product.count({ where: { stock: { lt: 10 } } })
    ]);

    const stats = {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders: totalOrders,
      newClients: 12,
      stockLevel: 85,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      activeClients: activeClients,
      lowStockItems: lowStockItems,
      monthlyGrowth: 12.5,
      weeklySales: [
        { day: 'Lun', sales: 4200, orders: 12 },
        { day: 'Mar', sales: 5200, orders: 15 },
        { day: 'Mer', sales: 3800, orders: 10 },
        { day: 'Jeu', sales: 6100, orders: 18 },
        { day: 'Ven', sales: 7200, orders: 22 },
        { day: 'Sam', sales: 4800, orders: 14 },
        { day: 'Dim', sales: 3500, orders: 9 }
      ]
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erreur dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Middleware de gestion d'erreurs 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route API non trouvée'
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('❌ Erreur globale:', err);
  
  res.status(500).json({
    success: false,
    message: 'Erreur serveur interne',
    error: NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
  console.log(`📊 Environnement: ${NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Commandes API: http://localhost:${PORT}/api/orders`);
  console.log(`⚙️ Production API: http://localhost:${PORT}/api/production/tasks`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🖼️ Images API: http://localhost:${PORT}/api/images/team-family.jpg`);
});
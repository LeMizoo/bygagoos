// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Nettoyer la base
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
  await prisma.activityLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.consumable.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;

  // Créer les utilisateurs
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const users = [
    {
      username: 'miantsatiana',
      email: 'miantsatiana@bygagoos.mg',
      password: hashedPassword,
      firstName: 'Miantso',
      lastName: 'Rakoto',
      role: 'ADMIN',
      profileImage: '/api/images/profiles/miantsatiana.jpg'
    },
    {
      username: 'tiafaniry',
      email: 'tiafaniry@bygagoos.mg',
      password: hashedPassword,
      firstName: 'Faniry',
      lastName: 'Randria',
      role: 'MANAGER',
      profileImage: '/api/images/profiles/tia-faniry.jpg'
    },
    {
      username: 'tovoniaina',
      email: 'tovoniaina@bygagoos.mg',
      password: hashedPassword,
      firstName: 'Tovoniaina',
      lastName: 'Rasoa',
      role: 'PRODUCTION_MANAGER',
      profileImage: '/api/images/profiles/tovoniaina.jpg'
    },
    {
      username: 'volatiana',
      email: 'volatiana@bygagoos.mg',
      password: hashedPassword,
      firstName: 'Volatiana',
      lastName: 'Rabe',
      role: 'LOGISTICS_MANAGER',
      profileImage: '/api/images/profiles/volatiana.jpg'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    createdUsers.push(user);
  }

  // Créer les clients
  const clients = [
    {
      name: 'TechMad SARL',
      email: 'contact@techmad.mg',
      phone: '+261 34 11 111 11',
      address: 'Lot II A 101 Bis Antananarivo',
      company: 'TechMad',
      notes: 'Client fidèle depuis 2015'
    },
    {
      name: 'Fashion MG',
      email: 'info@fashionmg.mg',
      phone: '+261 32 22 222 22',
      address: 'Ankorondrano, Antananarivo 101',
      company: 'Fashion MG',
      notes: 'Commande des uniformes d\'entreprise'
    },
    {
      name: 'Université d\'Antananarivo',
      email: 'commandes@univ-antananarivo.mg',
      phone: '+261 20 22 222 22',
      address: 'Campus Universitaire, Ankatso',
      company: 'UA',
      notes: 'T-shirts pour événements universitaires'
    },
    {
      name: 'Startup Madagascar',
      email: 'contact@startup.mg',
      phone: '+261 33 33 333 33',
      address: 'Ivandry Business Center, Antananarivo',
      company: 'Startup MG',
      notes: 'Nouveau client - à fidéliser'
    }
  ];

  const createdClients = [];
  for (const clientData of clients) {
    const client = await prisma.client.create({
      data: clientData
    });
    createdClients.push(client);
  }

  // Créer les produits
  const products = [
    {
      name: 'T-shirt Blanc 100% Coton',
      description: 'T-shirt basique, qualité premium, 180g/m²',
      price: 8000,
      category: 'Vêtements',
      stock: 500,
      minStock: 100,
      image: null
    },
    {
      name: 'Sweatshirt Capuche Noir',
      description: 'Sweatshirt à capuche, 280g/m², 50% coton 50% polyester',
      price: 15000,
      category: 'Vêtements',
      stock: 200,
      minStock: 50,
      image: null
    },
    {
      name: 'Polo Sport Bleu',
      description: 'Polo technique, tissu respirant, col et poignets contrastés',
      price: 12000,
      category: 'Vêtements',
      stock: 300,
      minStock: 75,
      image: null
    },
    {
      name: 'Tote Bag Canvas',
      description: 'Sac shopping en toile de jute, dimensions 40x40 cm',
      price: 5000,
      category: 'Accessoires',
      stock: 150,
      minStock: 30,
      image: null
    },
    {
      name: 'Casquette Trucker',
      description: 'Casquette ajustable avec mesh arrière',
      price: 7000,
      category: 'Accessoires',
      stock: 100,
      minStock: 25,
      image: null
    }
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData
    });
    createdProducts.push(product);
  }

  // Créer des commandes d'exemple
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'CMD-202401-0001',
      clientId: createdClients[0].id,
      totalAmount: 240000,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      deadline: nextWeek,
      notes: 'Commande urgente pour événement',
      deliveryDate: nextWeek,
      orderItems: {
        create: [
          {
            productId: createdProducts[0].id,
            quantity: 30,
            price: createdProducts[0].price
          }
        ]
      }
    }
  });

  // Ajouter des tâches pour cette commande
  const taskTypes = ['DESIGN', 'SCREEN_PREPARATION', 'PRINTING', 'DRYING', 'QUALITY_CHECK'];
  for (let i = 0; i < taskTypes.length; i++) {
    const status = i < 2 ? 'COMPLETED' : i === 2 ? 'IN_PROGRESS' : 'PENDING';
    await prisma.task.create({
      data: {
        orderId: order1.id,
        type: taskTypes[i],
        name: `Tâche ${i + 1}: ${taskTypes[i]}`,
        status: status,
        assignedToId: i === 2 ? createdUsers[2].id : null,
        startTime: i < 2 ? new Date(now.getTime() - (2 - i) * 24 * 60 * 60 * 1000) : null
      }
    });
  }

  console.log('✅ Seed terminé !');
  console.log('👤 Utilisateurs créés:', createdUsers.map(u => u.email).join(', '));
  console.log('🏢 Clients créés:', createdClients.map(c => c.name).join(', '));
  console.log('📦 Produits créés:', createdProducts.length);
  console.log('📋 Commande d\'exemple créée:', order1.orderNumber);
  console.log('🔐 Identifiants de test: email: miantsatiana@bygagoos.mg / password: demo123');
}

main()
  .catch(e => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
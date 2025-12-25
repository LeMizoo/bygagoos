const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Début du seeding avec données réelles...');

  try {
    // Nettoyer la base de données
    await prisma.activityLog.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.client.deleteMany();
    await prisma.product.deleteMany();
    await prisma.consumable.deleteMany();
    await prisma.user.deleteMany();

    console.log('🗑️  Base de données nettoyée');

    // Créer les utilisateurs
    const users = [
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'System',
        email: 'admin@bygagoos.mg',
        role: 'ADMIN'
      },
      {
        username: 'marcel',
        password: await bcrypt.hash('marcel123', 10),
        firstName: 'Marcel',
        lastName: 'Rakoto',
        email: 'marcel@bygagoos.mg',
        role: 'MANAGER'
      },
      {
        username: 'miantsatiana',
        password: await bcrypt.hash('miantsatiana123', 10),
        firstName: 'Miantsatiana',
        lastName: 'Rasoa',
        email: 'miantsatiana@bygagoos.mg',
        role: 'USER'
      }
    ];

    for (const userData of users) {
      await prisma.user.create({ data: userData });
    }

    console.log(`👥 ${users.length} utilisateurs créés`);

    // Créer les clients
    const clients = [
      {
        name: 'Tech Solutions SARL',
        email: 'contact@techsolutions.mg',
        phone: '+261 34 12 345 67',
        address: 'Lotissement Ivandry, Antananarivo 101',
        company: 'Tech Solutions SARL',
        notes: 'Client régulier, paiement à 30 jours'
      },
      {
        name: 'Epicerie du Coin',
        email: 'contact@epicerie.mg',
        phone: '+261 33 11 223 44',
        address: 'Rue Radama, Analakely',
        company: 'Epicerie du Coin',
        notes: 'Petite entreprise, paiement comptant'
      },
      {
        name: 'Boutique Fashion',
        email: 'info@fashion.mg',
        phone: '+261 32 55 667 78',
        address: 'Immeuble Colbert, Behoririka',
        company: 'Fashion Boutique',
        notes: 'Commandes saisonnières'
      }
    ];

    for (const clientData of clients) {
      await prisma.client.create({ data: clientData });
    }

    console.log(`👥 ${clients.length} clients créés`);

    // Créer les produits
    const products = [
      {
        name: 'T-shirt Blanc Premium',
        description: 'T-shirt 100% coton, qualité supérieure',
        price: 18000.00,
        category: 'Vêtements',
        stock: 150,
        minStock: 25
      },
      {
        name: 'Sweat-shirt Capuche',
        description: 'Sweat-shirt avec capuche, mix coton/polyester',
        price: 45000.00,
        category: 'Vêtements',
        stock: 75,
        minStock: 15
      },
      {
        name: 'Casquette Brodée',
        description: 'Casquette ajustable avec logo brodé haute qualité',
        price: 15000.00,
        category: 'Accessoires',
        stock: 200,
        minStock: 30
      }
    ];

    for (const productData of products) {
      await prisma.product.create({ data: productData });
    }

    console.log(`📦 ${products.length} produits créés`);

    // Créer les commandes
    const allClients = await prisma.client.findMany();
    const allProducts = await prisma.product.findMany();

    const orders = [];
    for (let i = 1; i <= 10; i++) {
      const client = allClients[Math.floor(Math.random() * allClients.length)];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 60));

      const order = await prisma.order.create({
        data: {
          orderNumber: `CMD-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`,
          clientId: client.id,
          totalAmount: 0,
          status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 3)],
          deliveryDate: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Ajouter des items
      const numItems = Math.floor(Math.random() * 2) + 1;
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity,
            price: product.price
          }
        });

        totalAmount += product.price * quantity;
      }

      // Mettre à jour le total
      await prisma.order.update({
        where: { id: order.id },
        data: { totalAmount }
      });

      orders.push(order);
    }

    console.log(`📝 ${orders.length} commandes créées`);

    console.log('✅ Seeding terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding
seed().catch(console.error);
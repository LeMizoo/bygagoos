const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

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
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const users = await prisma.user.createMany({
    data: [
      {
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'System',
        email: 'admin@bygagoos.mg',
        role: 'ADMIN'
      },
      {
        username: 'manager',
        password: await bcrypt.hash('manager123', 10),
        firstName: 'Manager',
        lastName: 'ByGagoos',
        email: 'manager@bygagoos.mg',
        role: 'MANAGER'
      },
      {
        username: 'user',
        password: await bcrypt.hash('user123', 10),
        firstName: 'Utilisateur',
        lastName: 'Standard',
        email: 'user@bygagoos.mg',
        role: 'USER'
      }
    ]
  });

  console.log(`👥 ${users.count} utilisateurs créés`);

  // Créer les clients
  const clients = await prisma.client.createMany({
    data: [
      {
        name: 'SARL Tech Solutions',
        email: 'contact@techsolutions.mg',
        phone: '+261 34 12 345 67',
        address: 'Ivandry, Antananarivo',
        company: 'Tech Solutions SARL'
      },
      {
        name: 'Epicerie du Coin',
        email: 'epicerie@ducoin.mg',
        phone: '+261 33 12 345 67',
        address: 'Analakely, Antananarivo',
        company: 'Epicerie du Coin'
      },
      {
        name: 'Boutique Fashion',
        email: 'info@fashion.mg',
        phone: '+261 32 12 345 67',
        address: 'Behoririka, Antananarivo',
        company: 'Fashion Boutique'
      },
      {
        name: 'Restaurant Le Gourmet',
        email: 'reservation@gourmet.mg',
        phone: '+261 20 22 345 67',
        address: 'Ambatonakanga, Antananarivo',
        company: 'Le Gourmet'
      },
      {
        name: 'Auto Parts Store',
        email: 'sales@autoparts.mg',
        phone: '+261 34 98 765 43',
        address: '67Ha, Antananarivo',
        company: 'Auto Parts Madagascar'
      }
    ]
  });

  console.log(`👥 ${clients.count} clients créés`);

  // Créer les produits
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'T-shirt Blanc',
        description: 'T-shirt 100% coton, qualité premium',
        price: 15000,
        category: 'Vêtements',
        stock: 100,
        minStock: 20
      },
      {
        name: 'Sweat-shirt Capuche',
        description: 'Sweat-shirt avec capuche, mix coton/polyester',
        price: 35000,
        category: 'Vêtements',
        stock: 50,
        minStock: 10
      },
      {
        name: 'Casquette Brodée',
        description: 'Casquette ajustable avec logo brodé',
        price: 12000,
        category: 'Accessoires',
        stock: 80,
        minStock: 15
      },
      {
        name: 'Sac Tote Canvas',
        description: 'Sac tote en canvas, impression recto-verso',
        price: 25000,
        category: 'Accessoires',
        stock: 40,
        minStock: 8
      },
      {
        name: 'Mug Céramique',
        description: 'Mug 350ml, impression couleur',
        price: 8000,
        category: 'Goodies',
        stock: 200,
        minStock: 30
      },
      {
        name: 'Sticker Vinyle',
        description: 'Sticker vinyle découpé, résistant aux intempéries',
        price: 2000,
        category: 'Goodies',
        stock: 500,
        minStock: 100
      }
    ]
  });

  console.log(`📦 ${products.count} produits créés`);

  // Créer les consommables
  const consumables = await prisma.consumable.createMany({
    data: [
      {
        name: 'Encre Sérigraphie Noir',
        description: 'Encre pour sérigraphie, couleur noire',
        category: 'Encres',
        stock: 25,
        minStock: 5,
        unit: 'Litre',
        supplier: 'Ink Suppliers Co.'
      },
      {
        name: 'Cadre Sérigraphie 40x60',
        description: 'Cadre en aluminium pour sérigraphie',
        category: 'Cadres',
        stock: 8,
        minStock: 3,
        unit: 'Unité',
        supplier: 'Printing Equipment Ltd.'
      },
      {
        name: 'Squeegee 75cm',
        description: 'Raclette en caoutchouc pour sérigraphie',
        category: 'Outils',
        stock: 15,
        minStock: 5,
        unit: 'Unité',
        supplier: 'Printing Tools Inc.'
      },
      {
        name: 'Émulsion Photosensible',
        description: 'Émulsion pour préparation des écrans',
        category: 'Chimie',
        stock: 12,
        minStock: 4,
        unit: 'Litre',
        supplier: 'Chemical Supplies'
      },
      {
        name: 'Papier Transfert',
        description: 'Papier transfert pour impression numérique',
        category: 'Papeterie',
        stock: 150,
        minStock: 50,
        unit: 'Feuilles',
        supplier: 'Paper World'
      }
    ]
  });

  console.log(`🛠️  ${consumables.count} consommables créés`);

  // Créer quelques commandes
  const productList = await prisma.product.findMany();
  const clientList = await prisma.client.findMany();

  const orders = [];
  
  for (let i = 1; i <= 15; i++) {
    const client = clientList[Math.floor(Math.random() * clientList.length)];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `CMD-2024-${String(i).padStart(4, '0')}`,
        clientId: client.id,
        totalAmount: 0, // Calculé après
        status: ['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'COMPLETED'][Math.floor(Math.random() * 5)],
        deliveryDate: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Ajouter des items à la commande
    const numItems = Math.floor(Math.random() * 3) + 1;
    let totalAmount = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = productList[Math.floor(Math.random() * productList.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
      
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

    // Mettre à jour le montant total
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount }
    });

    orders.push(order);
  }

  console.log(`📝 ${orders.length} commandes créées`);

  // Créer des logs d'activité
  const activityLogs = [];
  const actions = ['LOGIN', 'CREATE_ORDER', 'UPDATE_ORDER', 'CREATE_CLIENT', 'UPDATE_STOCK'];
  
  for (let i = 0; i < 20; i++) {
    const logDate = new Date();
    logDate.setHours(logDate.getHours() - Math.floor(Math.random() * 48));
    
    activityLogs.push({
      userId: Math.floor(Math.random() * 3) + 1,
      action: actions[Math.floor(Math.random() * actions.length)],
      details: `Action de test #${i + 1}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      createdAt: logDate
    });
  }

  await prisma.activityLog.createMany({
    data: activityLogs
  });

  console.log(`📊 ${activityLogs.length} logs d'activité créés`);

  console.log('✅ Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// backend/scripts/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed universel démarré...');

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    console.log('🧹 Nettoyage des tables (mode développement)...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.client.deleteMany();
    await prisma.consumable.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Tables nettoyées');
  }

  // =========================
  // UTILISATEURS
  // =========================
  // 1️⃣ Admin
  const adminEmail = 'admin@bygagoos.com';
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      name: 'Administrateur ByGagoos',
      role: 'admin',
    },
  });
  console.log(`✅ Admin créé ou existant: ${admin.email}`);

  // 2️⃣ User test en dev uniquement
  let user;
  if (isDev) {
    const userEmail = 'user@bygagoos.com';
    const userPassword = await bcrypt.hash('user123', 10);
    user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        password: userPassword,
        name: 'Utilisateur Test',
        role: 'user',
      },
    });
    console.log(`✅ Utilisateur test créé: ${user.email}`);
  }

  // =========================
  // CLIENTS
  // =========================
  const clientsData = [
    { name: 'Entreprise Malagasy', email: 'contact@malagasy.mg', phone: '+261341234567', address: 'Antananarivo 101' },
    { name: 'Boutique Tana', email: 'boutique@tana.mg', phone: '+261331234567', address: 'Analakely' },
  ];

  const clients = [];
  for (const c of clientsData) {
    const client = await prisma.client.create({ data: c });
    clients.push(client);
  }
  console.log('✅ Clients créés');

  // =========================
  // PRODUITS
  // =========================
  const productsData = [
    { name: 'T-shirt ByGagoos Blanc', description: 'T-shirt 100% coton', price: 29.99, category: 'Vêtements', stock: 150 },
    { name: 'T-shirt ByGagoos Noir', description: 'T-shirt premium', price: 34.99, category: 'Vêtements', stock: 100 },
    { name: 'Stickers Pack Spécial', description: 'Pack de 15 stickers', price: 19.99, category: 'Accessoires', stock: 200 },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.create({ data: p });
    products.push(product);
  }
  console.log('✅ Produits créés');

  // =========================
  // COMMANDE TEST (dev uniquement)
  // =========================
  if (isDev) {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'CMD-' + Date.now(),
        clientId: clients[0].id,
        status: 'completed',
        totalAmount: products[0].price * 2 + products[2].price,
        items: {
          create: [
            { productId: products[0].id, quantity: 2, price: products[0].price },
            { productId: products[2].id, quantity: 1, price: products[2].price },
          ],
        },
      },
    });
    console.log('✅ Commande test créée');
  }

  // =========================
  // CONSOMMABLES
  // =========================
  const consumablesData = [
    { name: 'Encre Noire', quantity: 25, unit: 'Litre', minStock: 10 },
    { name: 'Papier A4', quantity: 8500, unit: 'Feuilles', minStock: 2000 },
  ];

  for (const c of consumablesData) {
    await prisma.consumable.create({ data: c });
  }
  console.log('✅ Consommables créés');

  console.log('🌱 Seed universel terminé !');
  console.log('💻 Identifiants test (dev) :');
  console.log('Admin : admin@bygagoos.com / admin123');
  if (isDev) console.log('User : user@bygagoos.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

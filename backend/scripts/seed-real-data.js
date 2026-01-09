// backend/scripts/seed-real-data.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de données réelles...');

  // 1. Nettoyer la base (optionnel - attention en production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Nettoyage des tables...');
    await prisma.productionLog.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.client.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.consumable.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  }

  // 2. Créer l'admin principal
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bygagoos.mg' },
    update: {},
    create: {
      email: 'admin@bygagoos.mg',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'BYGAGOOS',
      phone: '+261 34 43 593 30',
      role: 'ADMIN',
      company: 'BYGAGOOS INK',
      businessType: 'serigraphie',
      isActive: true,
      verified: true,
    },
  });

  console.log('✅ Admin créé:', adminUser.email);

  // 3. Créer quelques produits de base
  const products = [
    {
      name: 'T-shirt Blanc Standard',
      description: 'T-shirt 100% coton, qualité standard',
      category: 't-shirts',
      basePrice: 15000,
      colors: ['Blanc', 'Noir', 'Rouge', 'Bleu'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      name: 'T-shirt Premium',
      description: 'T-shirt 100% coton, qualité premium',
      category: 't-shirts',
      basePrice: 25000,
      colors: ['Blanc', 'Noir', 'Gris'],
      sizes: ['M', 'L', 'XL'],
    },
    {
      name: 'Sweat-shirt',
      description: 'Sweat-shirt à capuche',
      category: 'sweats',
      basePrice: 45000,
      colors: ['Gris', 'Noir', 'Bordeaux'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      name: 'Casquette',
      description: 'Casquette plate',
      category: 'accessoires',
      basePrice: 12000,
      colors: ['Noir', 'Bleu', 'Rouge'],
      sizes: ['Taille unique'],
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        isActive: true,
      },
    });

    // Créer le stock pour ce produit
    await prisma.stock.create({
      data: {
        productId: product.id,
        quantity: 100,
        minStock: 20,
      },
    });

    console.log(`✅ Produit créé: ${product.name}`);
  }

  // 4. Créer quelques consommables
  const consumables = [
    { name: 'Encre Blanche', category: 'encres', quantity: 50, unit: 'kg', minStock: 10 },
    { name: 'Encre Noire', category: 'encres', quantity: 40, unit: 'kg', minStock: 10 },
    { name: 'Cadre 40x40', category: 'cadres', quantity: 15, unit: 'pièce', minStock: 5 },
    { name: 'Émulsion', category: 'chimie', quantity: 25, unit: 'L', minStock: 5 },
    { name: 'Séchoir UV', category: 'équipement', quantity: 2, unit: 'pièce', minStock: 1 },
  ];

  for (const consumable of consumables) {
    await prisma.consumable.create({
      data: consumable,
    });
    console.log(`✅ Consommable créé: ${consumable.name}`);
  }

  console.log('🌱 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
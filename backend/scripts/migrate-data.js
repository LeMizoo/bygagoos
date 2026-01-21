// Script de migration MongoDB → SQLite
// À exécuter une fois après la migration du schéma

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  console.log('Début de la migration des données...');
  
  try {
    // Ici vous importeriez les données depuis MongoDB
    // Pour l'instant, créons juste des données de test
    
    // Créer un admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@bygagoos.com',
        password: '$2b$10$YourHashedPasswordHere', // À remplacer
        name: 'Administrateur',
        role: 'admin'
      }
    });
    
    console.log('✅ Utilisateur admin créé');
    
    // Créer quelques produits de test
    const products = await prisma.product.createMany({
      data: [
        {
          name: 'T-shirt Basique',
          description: 'T-shirt 100% coton',
          price: 25.99,
          category: 'Vêtements',
          stock: 100
        },
        {
          name: 'Stickers Pack',
          description: 'Pack de 10 stickers',
          price: 12.50,
          category: 'Accessoires',
          stock: 50
        }
      ]
    });
    
    console.log('✅ Produits de test créés');
    
    console.log('��� Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();

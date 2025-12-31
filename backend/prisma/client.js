// backend/prisma/client.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty'
});

// Connexion à la base de données
prisma.$connect()
  .then(() => console.log('✅ Connexion à la base de données établie'))
  .catch(err => console.error('❌ Erreur de connexion à la base de données:', err));

// Fermeture propre à l'arrêt
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
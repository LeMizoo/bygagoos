#!/bin/bash
echo "================================================"
echo "MISE À JOUR DES CONTRÔLEURS"
echo "================================================"

cd backend

echo ""
echo "1. Création des services..."

# Service User
cat > services/userService.js << 'SERVICE_EOF'
const prisma = require('./prisma');
const bcrypt = require('bcryptjs');

class UserService {
  async findByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'user'
      }
    });
  }

  async update(id, userData) {
    const data = { ...userData };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return await prisma.user.update({ where: { id }, data });
  }

  async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }
}

module.exports = new UserService();
SERVICE_EOF

echo ""
echo "2. Mise à jour du contrôleur d'authentification..."
if [ -f controllers/authController.js ]; then
  cp controllers/authController.js controllers/authController.js.backup
  
  # Mettre à jour les imports
  sed -i 's|require.*models/User.*|const userService = require("../services/userService");|' controllers/authController.js
  
  # Remplacer les méthodes Mongoose
  sed -i 's|User\.findOne|userService.findByEmail|g' controllers/authController.js
  sed -i 's|User\.create|userService.create|g' controllers/authController.js
  sed -i 's|user\.save|// Remplacé par userService|g' controllers/authController.js
  
  echo "✅ authController.js mis à jour"
fi

echo ""
echo "3. Création d'un script de seed..."
cat > scripts/seed-prisma.js << 'SEED_EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('��� Début du seed...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@bygagoos.com' },
    update: {},
    create: {
      email: 'admin@bygagoos.com',
      password: adminPassword,
      name: 'Administrateur',
      role: 'admin'
    }
  });

  // Test client
  await prisma.client.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      name: 'Client Test',
      email: 'client@example.com',
      phone: '+261 34 12 34 56'
    }
  });

  // Test products
  await prisma.product.createMany({
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

  console.log('��� Seed terminé!');
}

main()
  .catch(console.error)
  .finally(() => prisma.\$disconnect());
SEED_EOF

echo ""
echo "================================================"
echo "✅ CONTRÔLEURS MIS À JOUR"
echo "================================================"
echo "Exécutez: node scripts/seed-prisma.js"
echo "Puis: npm start"

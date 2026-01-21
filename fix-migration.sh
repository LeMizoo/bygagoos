#!/bin/bash
echo "================================================"
echo "CORRECTION DE LA MIGRATION"
echo "================================================"

cd backend

echo ""
echo "1. Correction de package.json..."
# Supprimer mongoose
sed -i.bak '/"mongoose"/d' package.json

# Vérifier et ajouter prisma si manquant
if ! grep -q "@prisma/client" package.json; then
  node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.dependencies['@prisma/client'] = '^5.0.0';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
fi

echo ""
echo "2. Correction du schéma Prisma..."
cat > prisma/schema.prisma << 'SCHEMA_EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Client {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  phone     String?
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  orders Order[]
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  category    String?
  stock       Int      @default(0)
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  orderItems OrderItem[]
}

model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique
  clientId    String
  status      String   @default("pending")
  totalAmount Float
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  client    Client     @relation(fields: [clientId], references: [id])
  items     OrderItem[]
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Float
  
  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])
}

model Consumable {
  id          String   @id @default(cuid())
  name        String
  description String?
  quantity    Int      @default(0)
  unit        String?
  minStock    Int      @default(10)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
SCHEMA_EOF

echo ""
echo "3. Mise à jour du .env..."
if [ -f .env ]; then
  sed -i.bak 's|mongodb.*|DATABASE_URL="file:./dev.db"|g' .env
else
  echo 'DATABASE_URL="file:./dev.db"' > .env
  echo 'NODE_ENV=development' >> .env
  echo 'JWT_SECRET=your-secret-key' >> .env
fi

echo ""
echo "4. Réinstallation des dépendances..."
rm -rf node_modules package-lock.json
npm install

echo ""
echo "5. Génération Prisma..."
npx prisma generate

echo ""
echo "6. Création de la migration..."
npx prisma migrate dev --name init

echo ""
echo "7. Création du service Prisma..."
mkdir -p services
cat > services/prisma.js << 'SERVICE_EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

process.on('beforeExit', async () => {
  await prisma.\$disconnect();
});

module.exports = prisma;
SERVICE_EOF

echo ""
echo "================================================"
echo "✅ CORRECTION TERMINÉE"
echo "================================================"
echo "Prochaines étapes:"
echo "1. Mettre à jour les contrôleurs"
echo "2. Tester: npx prisma studio"
echo "3. Démarrer: npm start"

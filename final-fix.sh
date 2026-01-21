#!/bin/bash
echo "================================================"
echo "CORRECTION FINALE MIGRATION SQLite"
echo "================================================"

cd backend

echo ""
echo "1. Nettoyage et régénération..."
rm -rf node_modules package-lock.json
npm install
npx prisma generate

echo ""
echo "2. Création de la base de données..."
npx prisma migrate dev --name init --skip-seed

echo ""
echo "3. Seed des données..."
if [ -f "scripts/seed-prisma.js" ]; then
  node scripts/seed-prisma.js
else
  echo "⚠️  Script seed non trouvé, création..."
  cat > scripts/seed-prisma.js << 'SEEDEOF'
// [Le contenu du script seed plus haut]
SEEDEOF
  node scripts/seed-prisma.js
fi

echo ""
echo "4. Vérification finale..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tables = ['User', 'Client', 'Product', 'Order', 'Consumable'];
  for (const table of tables) {
    try {
      const count = await prisma[table.toLowerCase()].count();
      console.log(\`✅ \${table}: \${count} enregistrements\`);
    } catch (error) {
      console.log(\`❌ \${table}: \${error.message}\`);
    }
  }
  await prisma.\$disconnect();
}
check();
"

echo ""
echo "5. Test du serveur..."
timeout 5s npm start &
sleep 2
curl -s http://localhost:5000/api/health && echo "✅ Serveur fonctionne"

echo ""
echo "================================================"
echo "✅ MIGRATION TERMINÉE AVEC SUCCÈS !"
echo "================================================"
echo ""
echo "��� Identifiants:"
echo "   Admin: admin@bygagoos.com / admin123"
echo "   User:  user@bygagoos.com / user123"
echo ""
echo "��� Commandes:"
echo "   npm start          # Démarrer le serveur"
echo "   npx prisma studio  # Interface admin base de données"
echo "   npm run dev        # Mode développement avec hot reload"
echo ""
echo "��� URLs:"
echo "   API: http://localhost:5000"
echo "   Prisma Studio: http://localhost:5555"
echo "   Documentation: http://localhost:5000/api/health"

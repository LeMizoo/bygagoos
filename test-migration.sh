#!/bin/bash
echo "================================================"
echo "TEST DE LA MIGRATION"
echo "================================================"

cd backend

echo ""
echo "1. Vérification des dépendances..."
if grep -q "mongoose" package.json; then
  echo "❌ mongoose toujours présent"
else
  echo "✅ mongoose retiré"
fi

echo ""
echo "2. Vérification de Prisma..."
npx prisma --version

echo ""
echo "3. Vérification de la base de données..."
if [ -f "prisma/dev.db" ] || [ -f "dev.db" ]; then
  echo "✅ Base SQLite trouvée"
else
  echo "⚠️  Base non trouvée"
fi

echo ""
echo "4. Test du seed..."
node scripts/seed-prisma.js

echo ""
echo "5. Démarrage test du serveur..."
timeout 10s npm start &
sleep 3

echo ""
echo "6. Test de l'API..."
curl -s http://localhost:5000/api/health && echo ""
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bygagoos.com","password":"admin123"}' \
  | head -c 200 && echo "..."

echo ""
echo "7. Prisma Studio..."
echo "��� Ouvrez http://localhost:5555 dans votre navigateur"
echo "   (Ctrl+C pour arrêter)"
npx prisma studio

echo ""
echo "================================================"
echo "✅ TESTS TERMINÉS"

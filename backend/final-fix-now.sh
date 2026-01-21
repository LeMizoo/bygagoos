#!/bin/bash

echo "=== CORRECTION FINALE URGENTE ==="

cd backend || { echo "ERREUR: backend introuvable"; exit 1; }

echo "1. Correction du fichier .env..."
# Corriger la ligne DATABASE_URL
sed -i 's/DATABASE_URL="DATABASE_URL=/DATABASE_URL=/g' .env
sed -i 's/^DATABASE_URL=.*$/DATABASE_URL="file:\\.\\/dev.db"/g' .env

echo "  Contenu du .env corrigé :"
grep DATABASE_URL .env

echo "2. Nettoyage..."
rm -rf prisma/dev.db prisma/migrations 2>/dev/null

echo "3. Génération du client Prisma..."
npx prisma generate

echo "4. Création de la base de données..."
npx prisma migrate dev --name init --skip-seed 2>&1 | grep -v "warn\|info"

echo "5. Vérification de la base..."
if [ -f "prisma/dev.db" ]; then
    echo "  ✅ Base SQLite créée : $(ls -la prisma/dev.db | awk '{print $5}') octets"
else
    echo "  ❌ Échec de création de la base"
    exit 1
fi

echo "6. Exécution du seed..."
node scripts/seed-prisma.js

echo "7. Test du serveur..."
# Tester si le port 5000 est libre
if lsof -ti:5000 >/dev/null; then
    echo "  ⚠️  Port 5000 déjà utilisé, kill..."
    kill -9 $(lsof -ti:5000) 2>/dev/null
    sleep 2
fi

echo "  Démarrage du serveur en arrière-plan..."
npm start &
SERVER_PID=$!
sleep 5

echo "8. Test de santé..."
if curl -s http://localhost:5000/api/health | grep -q "OK"; then
    echo "  ✅ Serveur fonctionne correctement"
    echo "  PID du serveur : $SERVER_PID"
    echo "  URL : http://localhost:5000"
else
    echo "  ❌ Serveur non accessible"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "=== MIGRATION TERMINÉE AVEC SUCCÈS ==="
echo "Base de données : prisma/dev.db"
echo "Serveur : http://localhost:5000"
echo "Prêt pour le déploiement Vercel !"

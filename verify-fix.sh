#!/bin/bash

echo "=== VÉRIFICATION DE LA MIGRATION ==="

cd backend || exit 1

echo "1. Vérification des fichiers corrigés:"
grep -r "prisma\.\\\$disconnect" . --include="*.js" && echo "  ❌ Erreurs trouvées" || echo "  ✅ Aucune erreur de syntaxe"

echo "2. Vérification de la base de données:"
if [ -f "prisma/dev.db" ]; then
    echo "  ✅ Base SQLite existe"
    # Vérifier les tables
    echo "  Tables dans la base:"
    sqlite3 prisma/dev.db ".tables" 2>/dev/null || echo "    (nécessite sqlite3 installé)"
else
    echo "  ❌ Base SQLite manquante"
fi

echo "3. Vérification des dépendances:"
grep -E "(mongoose|@prisma/client)" package.json
echo "  mongoose devrait être absent, @prisma/client présent"

echo "4. Vérification des variables d'environnement:"
grep DATABASE_URL .env
echo "  Doit être: DATABASE_URL=\"file:./dev.db\""

echo "5. Test de connexion:"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('  ✅ Client Prisma chargé avec succès');
prisma.\$disconnect().then(() => console.log('  ✅ Déconnexion réussie'));
" 2>&1 | grep -v Warning

echo "=== VÉRIFICATION TERMINÉE ==="

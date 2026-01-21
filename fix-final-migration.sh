#!/bin/bash

echo "=== CORRECTION FINALE MIGRATION SQLITE ==="

cd backend || exit 1

# 1. Corriger l'erreur \$disconnect dans tous les fichiers
echo "1. Correction des erreurs \$disconnect..."
find . -name "*.js" -type f -exec grep -l "prisma\.\\\\\\\$disconnect" {} \; | while read file; do
    echo "  Correction de: $file"
    sed -i 's/prisma\.\\\$disconnect/prisma.\$disconnect/g' "$file"
done

# 2. Nettoyer l'environnement
echo "2. Nettoyage de l'environnement..."
rm -rf node_modules package-lock.json prisma/dev.db prisma/migrations .env.production 2>/dev/null

# 3. Réinstaller les dépendances
echo "3. Réinstallation des dépendances..."
npm install

# 4. Générer Prisma Client
echo "4. Génération du client Prisma..."
npx prisma generate

# 5. Créer la migration initiale
echo "5. Création de la migration..."
npx prisma migrate dev --name init --skip-seed

# 6. Vérifier la base de données
echo "6. Vérification de la base de données..."
if [ -f "prisma/dev.db" ]; then
    echo "  ✅ Base de données SQLite créée: prisma/dev.db"
    ls -la prisma/dev.db
else
    echo "  ❌ Base de données NON créée"
fi

# 7. Vérifier les variables d'environnement
echo "7. Vérification des variables d'environnement..."
echo "DATABASE_URL actuel:"
grep DATABASE_URL .env || echo "⚠️ DATABASE_URL non trouvé dans .env"

echo "=== CORRECTION TERMINÉE ==="

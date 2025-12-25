#!/bin/bash

echo "🧹 Nettoyage du projet ByGagoos Ink..."

# Supprimer les fichiers de démo et temporaires
echo "🗑️  Suppression des fichiers temporaires..."

# Fichiers racine à supprimer
rm -f *.bat *.sh *.ps1 *.yml *.backup 2>/dev/null

# Conserver uniquement les fichiers essentiels
keep_files=(
  "docker-compose.yml"
  "docker-compose.prod.yml"
  ".env.example"
  "README.md"
  "package.json"
  "vercel.json"
  "start.sh"
  "cleanup.sh"
)

# Nettoyer backend
echo "🧹 Nettoyage du backend..."
cd backend
rm -f *.bat *.sh *.backup *-simple.js *-backup.js 2>/dev/null
rm -rf scripts/ logs/ uploads/ .vercel/ 2>/dev/null
rm -f docker-compose.* Dockerfile.* 2>/dev/null || true
rm -f users.json seed*.js init*.sql 2>/dev/null || true
rm -f check-*.js test-*.js verify-*.js 2>/dev/null || true
cd ..

# Nettoyer frontend
echo "🧹 Nettoyage du frontend..."
cd frontend
rm -rf backup/ cypress/ .vercel/ 2>/dev/null
rm -f Dockerfile* nginx.conf 2>/dev/null
rm -f test-*.html 2>/dev/null
cd ..

# Supprimer les dossiers inutiles
echo "🗑️  Suppression des dossiers inutiles..."
rm -rf .vs/ nssm/ lib/ simple-frontend/ src/ 2>/dev/null
rm -rf docs/ config/ shared/ 2>/dev/null || true

# Vérifier la structure
echo "📁 Structure finale:"
find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.yml" | sort

echo ""
echo "✅ Nettoyage terminé !"
echo "🎯 Projet prêt pour la production"
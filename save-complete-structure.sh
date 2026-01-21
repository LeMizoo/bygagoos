#!/bin/bash
# save-complete-structure.sh
# Script pour sauvegarder la structure complète du projet sans node_modules
# Usage: ./save-complete-structure.sh [dossier_destination]

set -e  # Arrêter en cas d'erreur

# Configuration
PROJECT_NAME="ByGagoos-Ink"
SOURCE_DIR="."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Dossier de destination (par défaut: ../${PROJECT_NAME}-clean-${TIMESTAMP})
DEST_DIR="${1:-../${PROJECT_NAME}-clean-${TIMESTAMP}}"

echo "🚀 Début de la sauvegarde de la structure complète..."
echo "📁 Source: $(pwd)"
echo "📁 Destination: ${DEST_DIR}"
echo "⏰ Timestamp: ${TIMESTAMP}"
echo ""

# Créer le dossier de destination
mkdir -p "${DEST_DIR}"

# Liste des fichiers/dossiers à EXCLURE absolument
EXCLUDE_PATTERNS=(
  "node_modules"
  ".git"
  ".vscode"
  ".vercel"
  ".cache"
  ".DS_Store"
  "*.log"
  "*.backup"
  "*.bak"
  "*.tmp"
  "*.temp"
  "Thumbs.db"
  "desktop.ini"
  "__pycache__"
  ".pytest_cache"
  ".coverage"
  "coverage"
  ".nyc_output"
  "dist"
  "build"
  "out"
  ".next"
  ".nuxt"
  ".output"
  "*.exe"
  "*.dll"
  "*.so"
  "*.dylib"
  ".env.local"
  ".env.production.local"
  ".env.development.local"
  ".env.test.local"
  ".env.*.local"
  "*.pid"
  "*.seed"
  "*.pid.lock"
  "yarn.lock"
  "pnpm-lock.yaml"
  "package-lock.json.bak"
  "npm-debug.log*"
  "yarn-debug.log*"
  "yarn-error.log*"
  "lerna-debug.log*"
  ".npm"
  ".yarn"
  ".yarnrc.yml"
  ".pnp.*"
  "test-results"
  "reports"
  ".history"
  ".parcel-cache"
  ".vuepress/dist"
  ".temp"
  ".tmp"
  ".docusaurus"
  ".fusebox"
  ".webpack"
  ".serverless"
  ".fusebox"
  ".eslintcache"
  ".stylelintcache"
  ".rpt2_cache"
  ".rts2_cache_cjs"
  ".rts2_cache_es"
  ".rts2_cache_umd"
  ".node_repl_history"
  "*.tgz"
  ".yarn-integrity"
  "*.tsbuildinfo"
  ".next"
  ".expo"
  ".expo-shared"
  ".gradle"
  "**/gradle"
  "**/gradlew"
  "**/gradlew.bat"
  "**/local.properties"
  ".idea"
  "*.iml"
  "*.iws"
  "*.ipr"
  "*.swp"
  "*.swo"
  "*~"
  "*.swp"
  "*.swo"
  "*.pid"
  "*.pid.lock"
  "logs"
  "*.log.*"
  "log"
  "*.log.gz"
  "debug"
  "*.debug"
  "dump.rdb"
  "*.rdb"
  "*.aof"
  "redis-data"
  "mongodb-data"
  "mysql-data"
  "postgres-data"
  "sqlite-data"
  "*.db-journal"
  "*.db-wal"
  "*.db-shm"
  "*.frm"
  "*.ibd"
  "*.myd"
  "*.myi"
  "*.sock"
  "*.sock.*"
)

# Liste des fichiers à CONSERVER mais nettoyer (supprimer contenu sensible)
SENSITIVE_FILES=(
  ".env"
  "backend/.env"
  "frontend/.env"
  ".env.local"
  "backend/.env.local"
  "frontend/.env.local"
)

# Fonction pour créer un fichier .env.example sécurisé
create_safe_env_example() {
  local src_file="$1"
  local dest_dir="$2"
  local base_name=$(basename "$src_file")
  local example_file="${dest_dir}/${base_name}.example"
  
  if [ -f "$src_file" ]; then
    echo "# Fichier d'environnement exemple - À compléter avec vos valeurs" > "$example_file"
    echo "# Généré le: $(date)" >> "$example_file"
    echo "" >> "$example_file"
    
    # Copier les noms de variables sans les valeurs
    grep -E '^[A-Z_]+=' "$src_file" | while IFS= read -r line; do
      var_name=$(echo "$line" | cut -d'=' -f1)
      echo "${var_name}=" >> "$example_file"
    done
    
    # Ajouter des commentaires utiles
    echo "" >> "$example_file"
    echo "# Exemples de configuration:" >> "$example_file"
    echo "# DATABASE_URL=\"file:./dev.db\"" >> "$example_file"
    echo "# JWT_SECRET=\"votre_secret_ici\"" >> "$example_file"
    echo "# PORT=5000" >> "$example_file"
    echo "# NODE_ENV=\"production\"" >> "$example_file"
    
    echo "✅ Créé: ${example_file}"
  fi
}

# Fonction pour copier un fichier/dossier en excluant les patterns
copy_with_exclusions() {
  local src="$1"
  local dest="$2"
  
  # Construire les options d'exclusion pour rsync
  local exclude_opts=""
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    exclude_opts+=" --exclude='${pattern}'"
  done
  
  # Utiliser rsync pour copier avec exclusions
  if command -v rsync &> /dev/null; then
    eval "rsync -av ${exclude_opts} '${src}' '${dest}'"
  else
    # Fallback avec find et cp (plus lent)
    echo "⚠️ rsync non trouvé, utilisation de find/cp (plus lent)..."
    find "$src" -type f | while read -r file; do
      should_exclude=false
      for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$file" == *"$pattern"* ]]; then
          should_exclude=true
          break
        fi
      done
      
      if [ "$should_exclude" = false ]; then
        dest_file="${dest}${file#$src}"
        mkdir -p "$(dirname "$dest_file")"
        cp "$file" "$dest_file"
      fi
    done
  fi
}

# Fonction pour créer un fichier README dans la destination
create_readme() {
  cat > "${DEST_DIR}/README.md" << EOF
# ${PROJECT_NAME} - Structure Complète

Structure sauvegardée le: $(date)
Source: $(pwd)
Timestamp: ${TIMESTAMP}

## 📁 Structure des fichiers

\`\`\`
$(find "${DEST_DIR}" -type f | sed "s|${DEST_DIR}/||" | sort)
\`\`\`

## 🚀 Installation

1. **Backend:**
   \`\`\`bash
   cd backend
   cp .env.example .env  # Configurer les variables
   npm install
   npx prisma generate
   npm start
   \`\`\`

2. **Frontend:**
   \`\`\`bash
   cd frontend
   cp .env.example .env  # Configurer les variables
   npm install
   npm run dev
   \`\`\`

## 🔧 Scripts disponibles

- \`./start.sh\` - Démarrer le projet en développement
- \`./cleanup.sh\` - Nettoyer le projet
- \`./setup-vercel.sh\` - Configurer Vercel

## 📊 Informations techniques

- **Base de données:** SQLite (Prisma)
- **Backend:** Node.js + Express
- **Frontend:** React + Vite
- **Déploiement:** Vercel + Docker

## ⚠️ Notes importantes

1. Les fichiers \`.env\` originaux ne sont pas inclus (securité)
2. Les \`node_modules\` ne sont pas inclus
3. Les fichiers temporaires/logs sont exclus

## 📞 Support

Pour toute question, consulter la documentation dans le dossier \`docs/\`.
EOF
}

# Fonction pour créer un fichier manifest
create_manifest() {
  cat > "${DEST_DIR}/MANIFEST-${TIMESTAMP}.txt" << EOF
=== MANIFEST DE SAUVEGARDE ===
Projet: ${PROJECT_NAME}
Date: $(date)
Source: $(pwd)
Destination: ${DEST_DIR}
Timestamp: ${TIMESTAMP}

=== STATISTIQUES ===
Fichiers copiés: $(find "${DEST_DIR}" -type f | wc -l)
Dossiers copiés: $(find "${DEST_DIR}" -type d | wc -l)
Taille totale: $(du -sh "${DEST_DIR}" | cut -f1)

=== FICHIERS EXCLUS ===
$(printf '%s\n' "${EXCLUDE_PATTERNS[@]}" | sort)

=== FICHIERS SENSIBLES NETTOYÉS ===
$(printf '%s\n' "${SENSITIVE_FILES[@]}" | sort)

=== STRUCTURE ===
$(find "${DEST_DIR}" -type f | sed "s|${DEST_DIR}/||" | sort | head -100)

... (structure tronquée pour lisibilité)
EOF
}

# Étape 1: Copier la structure principale
echo "📋 Étape 1/4: Copie de la structure principale..."
copy_with_exclusions "${SOURCE_DIR}/" "${DEST_DIR}/"

# Étape 2: Traiter les fichiers sensibles
echo "🔐 Étape 2/4: Traitement des fichiers sensibles..."
for sensitive_file in "${SENSITIVE_FILES[@]}"; do
  if [ -f "${sensitive_file}" ]; then
    # Créer une version .example
    create_safe_env_example "${sensitive_file}" "${DEST_DIR}/$(dirname "${sensitive_file}")"
    
    # Supprimer le fichier .env original
    rm -f "${DEST_DIR}/${sensitive_file}"
    echo "⚠️ Supprimé (sécurité): ${sensitive_file}"
  fi
done

# Étape 3: Vérifier les fichiers essentiels
echo "✅ Étape 3/4: Vérification des fichiers essentiels..."
ESSENTIAL_FILES=(
  "backend/prisma/schema.prisma"
  "backend/prisma/dev.db"
  "backend/package.json"
  "backend/app.js"
  "frontend/package.json"
  "frontend/src/App.jsx"
  "frontend/vite.config.js"
  "docker-compose.yml"
  "vercel.json"
  ".gitignore"
)

missing_files=0
for essential_file in "${ESSENTIAL_FILES[@]}"; do
  if [ -f "${DEST_DIR}/${essential_file}" ]; then
    echo "  ✓ ${essential_file}"
  else
    echo "  ✗ MANQUANT: ${essential_file}"
    missing_files=$((missing_files + 1))
  fi
done

# Étape 4: Créer la documentation
echo "📄 Étape 4/4: Création de la documentation..."
create_readme
create_manifest

# Créer un script de restauration
cat > "${DEST_DIR}/restore-project.sh" << 'EOF'
#!/bin/bash
# Script de restauration du projet
# Usage: ./restore-project.sh [dossier_cible]

set -e

TARGET_DIR="${1:-.}"

echo "🔄 Restauration du projet..."
echo "📁 Cible: ${TARGET_DIR}"

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet sauvegardé"
  exit 1
fi

# Copier tous les fichiers
echo "📋 Copie des fichiers..."
cp -r . "${TARGET_DIR}" 2>/dev/null || true

# Initialiser les fichiers .env
echo "🔧 Configuration des fichiers d'environnement..."
if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo "  → backend/.env créé (à configurer)"
fi

if [ -f "frontend/.env.example" ] && [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
  echo "  → frontend/.env créé (à configurer)"
fi

echo "✅ Restauration terminée !"
echo ""
echo "🚀 Pour démarrer:"
echo "1. cd ${TARGET_DIR}"
echo "2. ./start.sh"
EOF

chmod +x "${DEST_DIR}/restore-project.sh"

# Résumé final
echo ""
echo "🎉 SAUVEGARDE TERMINÉE !"
echo "========================"
echo "📁 Destination: ${DEST_DIR}"
echo "📊 Taille: $(du -sh "${DEST_DIR}" | cut -f1)"
echo "📄 Fichiers: $(find "${DEST_DIR}" -type f | wc -l)"
echo "📁 Dossiers: $(find "${DEST_DIR}" -type d | wc -l)"
echo ""
echo "📋 Fichiers créés:"
echo "  • README.md - Documentation principale"
echo "  • MANIFEST-${TIMESTAMP}.txt - Liste complète"
echo "  • restore-project.sh - Script de restauration"
echo ""
echo "🔧 Prochaines étapes:"
echo "  1. Vérifier la structure dans ${DEST_DIR}"
echo "  2. Tester avec: cd ${DEST_DIR} && ./restore-project.sh /tmp/test"
echo "  3. Archiver: zip -r ${PROJECT_NAME}-clean.zip ${DEST_DIR}"
echo ""
echo "⚠️ IMPORTANT: Vérifiez que les fichiers sensibles (.env) ont bien été nettoyés !"

# Vérification finale
if [ $missing_files -gt 0 ]; then
  echo ""
  echo "⚠️ ATTENTION: $missing_files fichiers essentiels manquent !"
  echo "Vérifiez la structure avant de partager."
fi
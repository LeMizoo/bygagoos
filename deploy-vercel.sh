#!/bin/bash
# deploy-vercel.sh
# Script automatique pour builder et déployer backend + frontend sur Vercel

set -e

echo "🚀 Début du déploiement Vercel..."

# =========================
# 1️⃣ Backend
# =========================
echo "📦 Installation des dépendances backend..."
cd backend
npm install

echo "🔧 Vérification de Prisma..."
npx prisma generate
npx prisma migrate deploy || echo "⚠️ Migrations déjà appliquées ou erreur ignorée"

# =========================
# 2️⃣ Frontend
# =========================
echo "📦 Installation des dépendances frontend..."
cd ../frontend
npm install

echo "🏗️ Build frontend pour production..."
npm run build

# =========================
# 3️⃣ Vercel deploy
# =========================
echo "🌐 Déploiement sur Vercel..."
# Assurez-vous que vercel CLI est connecté et que le projet est configuré
vercel --prod --confirm

echo "✅ Déploiement terminé !"
echo "Frontend accessible via https://[ton-projet].vercel.app"
echo "Backend API accessible via https://[ton-projet-api].vercel.app/api"

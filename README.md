📘 README — Projet BYGAGOOS
1️⃣ Présentation

Ce projet est composé de :

Backend : API Node.js + Prisma + JWT, prête pour Vercel Serverless.

Frontend : Vite + React, communication via Axios avec le backend /api.

Objectif : gestion des utilisateurs, authentification, produits, commandes, stock, clients.

2️⃣ Structure du projet
projet-root/
├── backend/
│   ├── api/auth/         # routes Serverless: login.js, register.js, me.js, verify.js
│   ├── controllers/      # logique métier authController.js
│   ├── middleware/       # authenticateToken.js
│   └── prisma/           # schema Prisma, migrations
│
├── frontend/
│   ├── src/services/api.js  # Axios + interceptors + fonctions API
│   ├── .env.production
│   └── public/
│
└── vercel.json             # configuration build + routes Vercel

3️⃣ Variables d’environnement

Crée un fichier .env ou configure dans Vercel :

Backend (backend/.env)
DATABASE_URL="file:./dev.db" # ou URL Postgres / MySQL
JWT_SECRET="ton_secret_jwt"

Frontend (frontend/.env.production)
VITE_API_URL=https://bygagoos-api.vercel.app/api
VITE_APP_ENV=production
VITE_API_TIMEOUT=30000


⚠️ En local, tu peux créer .env.local pour le frontend :

VITE_API_URL=http://localhost:3002/api
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000

4️⃣ Installation

Backend

cd backend
npm install


Frontend

cd ../frontend
npm install

5️⃣ Développement local
Backend
cd backend
npx prisma migrate dev   # applique la base de données
node backend/api/health.js  # tester /health
node backend/server.js  # si tu utilises un serveur complet

Frontend
cd frontend
npm run dev


Frontend dev: http://localhost:5173

Backend dev: http://localhost:3002/api

6️⃣ Routes Backend principales
Méthode	Route	Description
POST	/api/auth/login	Connexion
POST	/api/auth/register	Création utilisateur
GET	/api/auth/me	Profil utilisateur (JWT)
GET	/api/auth/verify	Vérification du token
GET	/health	Test de disponibilité
7️⃣ Frontend — API Service

apiService.login({ email, password })

apiService.register(userData)

apiService.me()

apiService.verifyToken()

apiService.health()

Toutes les autres fonctions sont disponibles pour utilisateurs, produits, commandes, stock, clients.

8️⃣ Déploiement Vercel

Push du repo sur GitHub.

Connecte le repo à Vercel.

Configure les variables d’environnement dans Vercel (JWT_SECRET, DATABASE_URL).

Le backend Serverless fonctionne via /api/auth/login, /api/auth/register, /api/auth/me, /api/auth/verify.

Le frontend pointe automatiquement vers le backend via VITE_API_URL.

9️⃣ Tests

Vérification backend:

curl https://bygagoos-api.vercel.app/api/health


Connexion:

curl -X POST https://bygagoos-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'


Token JWT:

curl -H "Authorization: Bearer TON_TOKEN" https://bygagoos-api.vercel.app/api/auth/me

10️⃣ Notes

Chaque route backend est Serverless pour Vercel → un fichier par endpoint.

Axios frontend est configuré pour intercepter les erreurs et gérer automatiquement les redirections /login.

Toutes les communications sont en JSON.
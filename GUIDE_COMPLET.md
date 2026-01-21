# 🎉 ByGagoos Ink - Guide Complet de Fonctionnement

## ✅ État Actuel

Tous les bugs critiques ont été corrigés. L'application est maintenant **opérationnelle** et prête à l'emploi.

## 🚀 Démarrage Rapide

### Option 1 : Démarrage Simultané (Recommandé)

#### Terminal 1 - Backend:
```bash
cd backend
node app.js
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Ouvrez ensuite: **http://localhost:5173**

## 🔐 Connexion

Utilisez l'un de ces comptes pour tester:

### Compte Demo
```
Email: demo@bygagoos.mg
Mot de passe: demo123
```

### Compte Admin
```
Email: admin@bygagoos.mg
Mot de passe: Admin@2024
```

## 🗺️ Navigation

### Pages Publiques
- `/` - Page d'accueil
- `/login` - Connexion
- `/gallery` - Galerie des créations
- `/family` - À propos de la famille
- `/coming-soon` - Page placeholder

### Pages Admin (Protégées)
- `/admin/dashboard` - Tableau de bord
- `/admin/orders` - Gestion des commandes
- `/admin/clients` - Gestion des clients
- `/admin/products` - Gestion des produits
- `/admin/stock` - Gestion du stock
- `/admin/production` - Gestion de la production
- `/admin/profile` - Profil utilisateur
- `/admin/accounting` - Comptabilité
- `/admin/settings` - Paramètres

## 🔗 Architecture Technique

### Backend
```
Backend (Port 3002)
├── Express.js
├── Routes: auth, users, products, orders, etc.
├── Middleware: CORS, Helmet, Auth
└── Demo Mode: Authentification en mémoire
```

### Frontend
```
Frontend (Port 5173)
├── React 18
├── React Router v6
├── Vite (Dev Server)
├── AuthContext (Gestion d'état)
└── Composants React structurés
```

## 🔧 Configuration

### Variables d'Environnement

#### Backend (`backend/.env`)
```env
PORT=3002
NODE_ENV=development
JWT_SECRET=bygagoos_local_secret_2024
DATABASE_URL=mongodb://localhost:27017/bygagoos_ink
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3002/api
VITE_APP_NAME=BYGAGOOS INK
```

## 📡 Endpoints API

### Santé du Service
```
GET /api/health
Response: { status: 'healthy', service: 'bygagoos-api', ... }
```

### Authentification
```
POST /api/auth/login
Body: { email: "demo@bygagoos.mg", password: "demo123" }
Response: { token: "...", user: {...} }
```

### Ressources
```
GET /api/users
GET /api/products
GET /api/orders
GET /api/clients
GET /api/stock
GET /api/production
GET /api/consumables
GET /api/files
```

## 🎯 Flux de Fonctionnement

### 1. Utilisateur arrive sur le site
```
http://localhost:5173
    ↓
Accueil (HomePage)
```

### 2. Utilisateur se connecte
```
/login
  ↓
Saisit email + mot de passe
  ↓
AuthContext.login() appelle API
  ↓
POST /api/auth/login
  ↓
Reçoit token + user data
  ↓
Stocke dans localStorage
  ↓
Redirige vers /admin/dashboard
```

### 3. Accès aux pages protégées
```
PrivateRoute vérifie:
  ├── Token dans localStorage? ✓
  ├── User data valide? ✓
  └── Rôle autorisé? ✓
  ↓
Affiche page protégée
```

## 🔍 Débogage

### Vérifier les logs
- **Backend**: Console du terminal du backend
- **Frontend**: Console du navigateur (F12)

### Tester un endpoint
```bash
# Depuis un terminal
curl -X GET http://localhost:3002/api/health

# Ou utiliser Postman/Insomnia
```

### Problèmes courants

**Erreur: "Cannot connect to localhost:3002"**
- Vérifiez que le backend est lancé
- Vérifiez le port dans `.env` du backend

**Erreur: "Invalid credentials"**
- Utilisez exactement: `demo@bygagoos.mg` / `demo123`
- Ou: `admin@bygagoos.mg` / `Admin@2024`

**Erreur: "Route not found"**
- Vérifiez l'URL est correcte
- Assurez-vous que le backend est en marche

## 📦 Dépendances Principales

### Backend
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.0.3"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.30.3",
  "axios": "^1.6.2"
}
```

## 📋 Checklist de Vérification

- [x] Backend démarre sans erreur
- [x] Frontend compile sans erreur
- [x] Page d'accueil charge
- [x] Connexion fonctionne
- [x] Redirection après login fonctionne
- [x] Pages protégées sont accessibles aux utilisateurs connectés
- [x] Logout fonctionne
- [x] API health endpoint répond

## 🎓 Prochaines Étapes d'Apprentissage

1. **Comprendre React Router**: Comment les routes sont structurées
2. **Comprendre AuthContext**: Comment l'authentification est gérée
3. **Étudier Express**: Comment les endpoints sont définis
4. **Apprendre Prisma**: Comment les models sont définis (pour la DB)

## 💬 Support

Pour toute question ou problème:
1. Consultez les logs du terminal
2. Vérifiez la console du navigateur (F12)
3. Vérifiez que les services (Backend, Frontend) sont en marche
4. Vérifiez les fichiers `.env`

## 📞 Contact ByGagoos Ink

- **Téléphone**: +261 34 43 593 30
- **Adresse**: Lot IPA 165, Anosimasina, Antananarivo 102
- **Activité**: Sérigraphie textile familiale

---

**Application**: ByGagoos Ink v1.0
**Statut**: ✅ Opérationnelle
**Dernière mise à jour**: 13 Janvier 2026

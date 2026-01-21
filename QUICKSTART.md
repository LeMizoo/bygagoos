# 🚀 QUICKSTART - ByGagoos Ink

## En 3 Minutes: Lancez l'Application

### 1️⃣ Terminal 1 - Démarrez le Backend
```bash
cd backend
node app.js
```

**Vous verrez**: `✨ ByGagoos Ink Backend démarré ! Port: 3002`

### 2️⃣ Terminal 2 - Démarrez le Frontend
```bash
cd frontend
npm run dev
```

**Vous verrez**: Application lancée sur `http://localhost:5173`

### 3️⃣ Ouvrez le Navigateur
```
http://localhost:5173
```

### 4️⃣ Connectez-vous
```
Email: demo@bygagoos.mg
Mot de passe: demo123
```

## ✅ Qu'est-ce qui Marche Maintenant?

- ✅ Authentification (Demo & Admin)
- ✅ Navigation entre les pages
- ✅ Pages protégées (routes admin)
- ✅ Communication API Backend ↔ Frontend
- ✅ Gestion de session (localStorage)
- ✅ Gestion d'erreurs globale

## 🔧 Commandes Utiles

### Backend
```bash
cd backend
node app.js          # Lancer le serveur
npm run dev          # Lancer en mode dev avec nodemon
```

### Frontend
```bash
cd frontend
npm run dev          # Lancer le dev server
npm run build        # Compiler pour production
npm run preview      # Prévisualiser le build
```

## 📍 URLs Principales

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3002 |
| Health | http://localhost:3002/api/health |

## 🔐 Comptes Disponibles

| Email | Mot de passe | Rôle |
|-------|------------|------|
| demo@bygagoos.mg | demo123 | User |
| admin@bygagoos.mg | Admin@2024 | Admin |

## 🗂️ Structure Rapide

```
ByGagoos-Ink/
├── backend/              # API Express.js
│   ├── app.js           # Point d'entrée
│   ├── routes/          # Routes API
│   └── middleware/      # Middleware
├── frontend/            # Application React
│   ├── src/
│   │   ├── App.jsx     # Composant principal
│   │   ├── pages/      # Pages React
│   │   ├── context/    # Auth Context
│   │   └── services/   # API client
│   └── vite.config.js  # Config Vite
└── docs/               # Documentation
```

## 🐛 Si Ça Ne Marche Pas...

**Backend n'écoute pas sur 3002**
```bash
# Vérifier les ports en utilisation
netstat -ano | findstr :3002
# Tuer le processus si nécessaire
```

**Frontend ne charge pas**
```bash
# Réinstaller les dépendances
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Erreur de connexion API**
```bash
# Vérifier que le backend est lancé
curl http://localhost:3002/api/health
# Doit retourner du JSON
```

## 📚 Documentation Complète

- **[GUIDE_COMPLET.md](GUIDE_COMPLET.md)** - Guide détaillé
- **[RESUME_CORRECTIONS.md](RESUME_CORRECTIONS.md)** - Bugs corrigés
- **[BUGFIX_REPORT.md](BUGFIX_REPORT.md)** - Rapport technique

## 🎯 Prochaines Étapes

1. Explorer l'interface (HomePage → LoginPage → Dashboard)
2. Consulter [GUIDE_COMPLET.md](GUIDE_COMPLET.md)
3. Lire le code dans `src/pages/` et `src/components/`
4. Commencer à développer les nouvelles features!

## 💡 Tips

- **F12** - Ouvrir la console du navigateur pour les logs
- **Network tab** - Voir les requêtes API
- **Terminal du Backend** - Voir les logs serveur

---

**Statut**: ✅ Application Opérationnelle  
**Bugs Corrigés**: 10  
**Prêt pour**: Développement  

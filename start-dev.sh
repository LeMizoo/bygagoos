#!/bin/bash

echo "=================================================="
echo "DEMARRAGE DE BYGAGOOS INK (SANS DOCKER)"
echo "=================================================="
echo ""

# Vérifier Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
echo "Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" < "20.19" ]]; then
    echo "ATTENTION: Vite necessite Node.js 20.19+"
    echo "Version actuelle: $NODE_VERSION"
    echo "Mode developpement force..."
fi

# Arrêter les processus existants
echo "ARRET DES PROCESSUS EXISTANTS..."
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "node.*frontend" 2>/dev/null || true

# Configuration Backend
echo ""
echo "CONFIGURATION BACKEND..."
cd backend

# Créer fichier .env si nécessaire
if [ ! -f ".env" ]; then
    echo "Creation du fichier .env..."
    cat > .env << 'ENV'
DATABASE_URL="file:./dev.db"
JWT_SECRET="bygagoos-secret-key-change-this-in-production"
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:5173"
ENV
fi

# Installer dépendances
echo "Installation des dependances backend..."
npm install --silent

# Démarrer backend
echo "Demarrage du backend sur http://localhost:5000"
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Attendre que le backend soit prêt
echo "Attente du demarrage backend..."
sleep 8

# Configuration Frontend
echo ""
echo "CONFIGURATION FRONTEND..."
cd ../frontend

# Créer fichier .env si nécessaire
if [ ! -f ".env.local" ]; then
    echo "Creation du fichier .env.local..."
    cat > .env.local << 'ENV'
VITE_API_URL=http://localhost:5000
VITE_APP_NAME="ByGagoos Ink"
ENV
fi

# Installer dépendances
echo "Installation des dependances frontend..."
npm install --silent

# Démarrer frontend
echo "Demarrage du frontend sur http://localhost:5173"
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "SERVICES DEMARRES AVEC SUCCES!"
echo "==============================="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo "API Health: http://localhost:5000/api/health"
echo ""
echo "Appuyez sur Ctrl+C pour arreter"

# Nettoyage à l'arrêt
cleanup() {
    echo ""
    echo "ARRET DES SERVICES..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Services arretes."
    exit 0
}

trap cleanup INT TERM

# Attendre
wait

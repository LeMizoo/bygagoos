#!/bin/bash
echo "🚀 Démarrage de ByGagoos Ink..."

# Fonction pour tuer les processus sur les ports utilisés
kill_port() {
    local port=$1
    local pid=$(netstat -ano | grep :$port | grep LISTENING | awk '{print $5}' | head -1)
    if [ ! -z "$pid" ]; then
        echo "🛑 Arrêt du processus $pid sur le port $port"
        taskkill //PID $pid //F > /dev/null 2>&1
    fi
}

# Nettoyer les ports
kill_port 3002
kill_port 5173

# Attendre un peu
sleep 2

echo "📦 Démarrage du backend..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 3

echo "🌐 Démarrage du frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Services démarrés !"
echo "📊 Backend: http://localhost:3002"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter tous les services"

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill_port 3002
    kill_port 5173
    echo "✅ Services arrêtés"
    exit 0
}

# Gestionnaire de signal
trap cleanup SIGINT SIGTERM

# Attendre
wait
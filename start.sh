#!/bin/bash

echo "🚀 Démarrage de ByGagoos Ink en développement..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Démarrer les services
echo "📦 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier l'état des services
echo "🔍 Vérification des services..."

# Vérifier PostgreSQL
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL est démarré"
else
    echo "❌ PostgreSQL n'est pas démarré"
fi

# Vérifier le backend
if docker-compose ps backend | grep -q "Up"; then
    echo "✅ Backend est démarré"
    
    # Vérifier la santé de l'API
    HEALTH_CHECK=$(curl -s http://localhost:3001/api/health || echo "FAILED")
    if [[ $HEALTH_CHECK == *"healthy"* ]]; then
        echo "✅ API est fonctionnelle"
    else
        echo "⚠️  API ne répond pas correctement"
    fi
else
    echo "❌ Backend n'est pas démarré"
fi

# Vérifier le frontend
if docker-compose ps frontend | grep -q "Up"; then
    echo "✅ Frontend est démarré"
    echo "🌐 Frontend accessible sur: http://localhost:5173"
else
    echo "❌ Frontend n'est pas démarré"
fi

echo ""
echo "🎉 Démarrage terminé !"
echo "====================="
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:3001"
echo "API Health: http://localhost:3001/api/health"
echo "Prisma Studio: http://localhost:5555"
echo ""
echo "📝 Commandes utiles:"
echo "  docker-compose logs -f [service]  # Voir les logs"
echo "  docker-compose down               # Arrêter les services"
echo "  docker-compose restart [service]  # Redémarrer un service"
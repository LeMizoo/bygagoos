#!/bin/bash

echo "🚀 Demarrage de ByGagoos Ink en developpement..."

# Verifier si Docker est installe
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installe. Veuillez installer Docker."
    exit 1
fi

# Verifier si Docker Compose est installe
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installe. Veuillez installer Docker Compose."
    exit 1
fi

# Arreter les conteneurs existants
echo "🛑 Arret des conteneurs existants..."
docker-compose down

# Demarrer les services
echo "📦 Demarrage des services..."
docker-compose up -d

# Attendre que les services soient prets
echo "⏳ Attente du demarrage des services..."
sleep 10

# Verifier l'etat des services
echo "🔍 Verification des services..."

# Verifier PostgreSQL
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL est demarre"
else
    echo "❌ PostgreSQL n'est pas demarre"
fi

# Verifier le backend
if docker-compose ps backend | grep -q "Up"; then
    echo "✅ Backend est demarre"
    
    # Verifier la sante de l'API
    HEALTH_CHECK=$(curl -s http://localhost:3002/api/health || echo "FAILED")
    if [[ $HEALTH_CHECK == *"healthy"* ]]; then
        echo "✅ API est fonctionnelle"
    else
        echo "⚠️  API ne repond pas correctement"
    fi
else
    echo "❌ Backend n'est pas demarre"
fi

# Verifier le frontend
if docker-compose ps frontend | grep -q "Up"; then
    echo "✅ Frontend est demarre"
    echo "🌐 Frontend accessible sur: http://localhost:5173"
else
    echo "❌ Frontend n'est pas demarre"
fi

echo ""
echo "🎉 Demarrage termine !"
echo "====================="
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:3002"
echo "API Health: http://localhost:3002/api/health"
echo "Prisma Studio: http://localhost:5555"
echo ""
echo "📝 Commandes utiles:"
echo "  docker-compose logs -f [service]  # Voir les logs"
echo "  docker-compose down               # Arreter les services"
echo "  docker-compose restart [service]  # Redemarrer un service"

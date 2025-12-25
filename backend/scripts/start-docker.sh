#!/bin/bash

echo "🚀 Démarrage de ByGagoos Ink avec Docker..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire et démarrer les services
echo "📦 Construction des images..."
docker-compose build

echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre le démarrage
echo "⏳ Attente du démarrage des services..."
sleep 15

# Vérifier l'état des services
echo "🔍 Vérification des services..."

services=("postgres" "backend" "frontend")
for service in "${services[@]}"; do
    if docker-compose ps | grep -q "${service}.*Up"; then
        echo "✅ $service est démarré"
    else
        echo "❌ $service n'est pas démarré"
    fi
done

# Vérifier la santé de l'API
echo "🌐 Vérification de l'API..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API est fonctionnelle"
else
    echo "⚠️  API ne répond pas (HTTP $API_HEALTH)"
fi

echo ""
echo "🎉 Démarrage terminé !"
echo "====================="
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:3001"
echo "API Health: http://localhost:3001/api/health"
echo "PostgreSQL: localhost:5432"
echo ""
echo "📝 Commandes utiles:"
echo "  docker-compose logs -f [service]  # Voir les logs"
echo "  docker-compose down               # Arrêter les services"
echo "  docker-compose restart [service]  # Redémarrer un service"
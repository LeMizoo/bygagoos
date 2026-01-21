#!/bin/bash

echo "=================================================="
echo "DEMARRAGE DE BYGAGOOS INK EN DEVELOPPEMENT"
echo "=================================================="
echo ""

# Vérifier si Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "ERREUR: Docker n'est pas installe ou n'est pas en cours d'execution"
    echo "Veuillez demarrer Docker Desktop ou utiliser le mode sans Docker"
    exit 1
fi

# Arrêter les conteneurs existants
echo "ARRET DES CONTENEURS EXISTANTS..."
docker-compose down 2>/dev/null || true

# Démarrer les services
echo "DEMARRAGE DES SERVICES..."
docker-compose up -d --build

# Attendre le démarrage
echo "ATTENTE DU DEMARRAGE DES SERVICES..."
sleep 10

# Vérifier les services
echo "VERIFICATION DES SERVICES..."

# Vérifier PostgreSQL
if docker-compose ps postgres | grep -q "Up"; then
    echo "OK - PostgreSQL est demarre"
else
    echo "ERREUR - PostgreSQL n'est pas demarre"
fi

# Vérifier Backend
if docker-compose ps backend | grep -q "Up"; then
    echo "OK - Backend est demarre"
else
    echo "ERREUR - Backend n'est pas demarre"
fi

# Vérifier Frontend
if docker-compose ps frontend | grep -q "Up"; then
    echo "OK - Frontend est demarre"
else
    echo "ERREUR - Frontend n'est pas demarre"
fi

echo ""
echo "DEMARRAGE TERMINE !"
echo "======================"
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:5000"
echo "API Health: http://localhost:5000/api/health"
echo ""
echo "COMMANDES UTILES:"
echo "  docker-compose logs -f [service]  # Voir les logs"
echo "  docker-compose down               # Arreter les services"
echo "  docker-compose restart [service]  # Redemarrer un service"

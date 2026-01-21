#!/bin/bash
# test-health.sh - Tester la santé de l'application

echo "=================================="
echo "Test de santé - ByGagoos Ink"
echo "=================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Backend
echo "Vérification du Backend..."
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend est accessible"
    BACKEND_HEALTH=$(curl -s http://localhost:3002/api/health)
    echo "  Réponse: $BACKEND_HEALTH"
else
    echo -e "${RED}✗${NC} Backend n'est pas accessible"
    echo "  Assurez-vous que le backend est lancé sur le port 3002"
fi

echo ""

# Test Frontend
echo "Vérification du Frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend est accessible"
else
    echo -e "${YELLOW}⚠${NC} Frontend n'est pas accessible sur le port 5173"
    echo "  Assurez-vous que le frontend est lancé avec: npm run dev"
fi

echo ""
echo "=================================="
echo "URLs de test:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3002/api/health"
echo "=================================="

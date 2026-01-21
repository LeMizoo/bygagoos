#!/bin/bash
echo "=== TEST LOCALHOST:3001 ==="

# Test 1: Health check
echo "1. Health check:"
curl -s http://localhost:3001/health | jq -r '.status, .message'

echo ""
# Test 2: Login avec admin
echo "2. Authentification admin:"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bygagoos.com","password":"admin123"}')

echo "Réponse:"
echo "$RESPONSE" | jq '.'

# Extraire le token pour test
TOKEN=$(echo "$RESPONSE" | jq -r '.token')
if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
    echo ""
    echo "✅ Token obtenu avec succès!"
    
    # Test 3: Utiliser le token pour accéder à une route protégée
    echo ""
    echo "3. Test de route protégée:"
    curl -s http://localhost:3001/api/auth/me \
      -H "Authorization: Bearer $TOKEN" | jq '.'
else
    echo ""
    echo "❌ Échec d'authentification"
    echo "Détails de la réponse:"
    echo "$RESPONSE"
fi

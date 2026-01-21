#!/bin/bash
# =========================
# SCRIPT COMPLET DE TEST BACKEND BYGAGOOS
# GET, POST, PUT
# =========================

BASE_URL="http://localhost:5002/api"
EMAIL="admin@bygagoos.mg"
PASSWORD="tonMotDePasseExact"

echo "=== Login pour récupérer le token ==="
# Login et extraction automatique du token sans jq
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -oP '(?<="token":")[^"]+')

if [ -z "$TOKEN" ]; then
    echo "❌ Impossible de récupérer le token. Vérifie ton email et mot de passe."
    exit 1
fi

echo "✅ Token récupéré"
echo ""

# Fonction pour tester une route GET
test_get() {
    local route=$1
    echo "=== GET $route ==="
    curl -s -X GET "$BASE_URL/$route" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json"
    echo -e "\n"
}

# Fonction pour tester une route POST
test_post() {
    local route=$1
    local data=$2
    echo "=== POST $route ==="
    curl -s -X POST "$BASE_URL/$route" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d "$data"
    echo -e "\n"
}

# Fonction pour tester une route PUT
test_put() {
    local route=$1
    local data=$2
    echo "=== PUT $route ==="
    curl -s -X PUT "$BASE_URL/$route" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d "$data"
    echo -e "\n"
}

# =========================
# TEST ROUTES GET
# =========================
test_get "users"
test_get "products"
test_get "orders"
test_get "clients"
test_get "stock"

# =========================
# TEST ROUTES POST
# =========================

# Créer un utilisateur de test
test_post "users" '{"name":"Utilisateur Test2","email":"test2@bygagoos.mg","password":"test123","role":"user"}'

# Créer un produit de test
test_post "products" '{"name":"Produit Test","price":1000,"stock":10}'

# Créer un client de test
test_post "clients" '{"name":"Client Test","email":"client@test.com"}'

# Créer une commande de test
test_post "orders" '{"clientId":"cmkkvd1vv0001fbr57ys61mqz","products":[{"productId":"cmkkvd1o10000fbr5bx01f8xl","quantity":2}]}'

# =========================
# TEST ROUTES PUT
# =========================

# Mettre à jour le stock d’un produit (exemple)
test_put "stock" '{"productId":"cmkkvd1o10000fbr5bx01f8xl","quantity":50}'

echo "=== Test complet terminé ✅ ==="

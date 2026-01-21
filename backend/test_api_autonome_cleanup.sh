#!/bin/bash
# =========================
# SCRIPT COMPLET AUTOMATIQUE BACKEND BYGAGOOS
# GET, POST, PUT + nettoyage automatique des entités test
# =========================

BASE_URL="http://localhost:5002/api"
EMAIL="admin@bygagoos.mg"
PASSWORD="tonMotDePasseExact"

echo "=== Login pour récupérer le token ==="
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -oP '(?<="token":")[^"]+')

if [ -z "$TOKEN" ]; then
    echo "❌ Impossible de récupérer le token. Vérifie ton email et mot de passe."
    exit 1
fi
echo "✅ Token récupéré"
echo ""

# Fonctions utilitaires
test_get() { local route=$1; echo "=== GET $route ==="; curl -s -X GET "$BASE_URL/$route" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"; echo -e "\n"; }
test_post() { local route=$1; local data=$2; curl -s -X POST "$BASE_URL/$route" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data"; }
test_put() { local route=$1; local data=$2; curl -s -X PUT "$BASE_URL/$route" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data"; }
test_delete() { local route=$1; curl -s -X DELETE "$BASE_URL/$route" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"; }

# =========================
# Création des entités test
# =========================
echo "=== Création d'un utilisateur test ==="
USER_JSON=$(test_post "users" '{"name":"Utilisateur Auto","email":"auto@bygagoos.mg","password":"test123","role":"user"}')
USER_ID=$(echo $USER_JSON | grep -oP '(?<="id":")[^"]+')
echo "✅ Utilisateur créé : $USER_ID"

echo "=== Création d'un produit test ==="
PRODUCT_JSON=$(test_post "products" '{"name":"Produit Auto","price":1000,"stock":10}')
PRODUCT_ID=$(echo $PRODUCT_JSON | grep -oP '(?<="id":")[^"]+')
echo "✅ Produit créé : $PRODUCT_ID"

echo "=== Création d'un client test ==="
CLIENT_JSON=$(test_post "clients" '{"name":"Client Auto","email":"client.auto@bygagoos.mg"}')
CLIENT_ID=$(echo $CLIENT_JSON | grep -oP '(?<="id":")[^"]+')
echo "✅ Client créé : $CLIENT_ID"

# =========================
# Création d'une commande test
# =========================
echo "=== Création d'une commande test ==="
ORDER_JSON=$(test_post "orders" "{\"clientId\":\"$CLIENT_ID\",\"products\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}]}")
ORDER_ID=$(echo $ORDER_JSON | grep -oP '(?<="id":")[^"]+')
echo "✅ Commande créée : $ORDER_ID"

# =========================
# Mise à jour du stock du produit
# =========================
echo "=== Mise à jour du stock du produit ==="
test_put "stock" "{\"productId\":\"$PRODUCT_ID\",\"quantity\":50}"
echo "✅ Stock mis à jour"

# =========================
# Test de toutes les routes GET
# =========================
test_get "users"
test_get "products"
test_get "orders"
test_get "clients"
test_get "stock"

# =========================
# Nettoyage automatique des entités test
# =========================
echo "=== Nettoyage des entités test ==="
test_delete "orders/$ORDER_ID"
echo "✅ Commande supprimée"

test_delete "clients/$CLIENT_ID"
echo "✅ Client supprimé"

test_delete "products/$PRODUCT_ID"
echo "✅ Produit supprimé"

test_delete "users/$USER_ID"
echo "✅ Utilisateur supprimé"

echo "=== Test complet terminé ✅ toutes les entités test supprimées ==="

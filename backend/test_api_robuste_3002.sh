#!/bin/bash
# =========================
# SCRIPT ROBUSTE AUTOMATIQUE BACKEND BYGAGOOS
# GET, POST, PUT + nettoyage automatique + gestion des erreurs
# Port 3002 + Super Admin
# =========================

BASE_URL="http://localhost:3002/api"

# Super Admin pour toutes les actions
EMAIL="tovoniaina.rahendrison@gmail.com"
PASSWORD="bygagoos@2024"

# Variables pour stocker les IDs créés
USER_ID=""
PRODUCT_ID=""
CLIENT_ID=""
ORDER_ID=""

# Générer des emails dynamiques pour éviter les doublons
USER_EMAIL="auto_$(date +%s)@bygagoos.mg"
CLIENT_EMAIL="client_$(date +%s)@bygagoos.mg"

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

# Fonction pour nettoyer les entités créées
cleanup() {
    echo "=== Nettoyage automatique des entités créées ==="
    [ -n "$ORDER_ID" ] && test_delete "orders/$ORDER_ID" && echo "✅ Commande supprimée"
    [ -n "$CLIENT_ID" ] && test_delete "clients/$CLIENT_ID" && echo "✅ Client supprimé"
    [ -n "$PRODUCT_ID" ] && test_delete "products/$PRODUCT_ID" && echo "✅ Produit supprimé"
    [ -n "$USER_ID" ] && test_delete "users/$USER_ID" && echo "✅ Utilisateur supprimé"
    echo "=== Nettoyage terminé ==="
}

# =========================
# Création des entités test
# =========================
echo "=== Création d'un utilisateur test ==="
USER_JSON=$(test_post "users" "{\"name\":\"Utilisateur Auto\",\"email\":\"$USER_EMAIL\",\"password\":\"test123\",\"role\":\"user\"}")
USER_ID=$(echo $USER_JSON | grep -oP '(?<="id":")[^"]+')
if [ -z "$USER_ID" ]; then
    echo "❌ Échec création utilisateur. Arrêt du script."
    cleanup
    exit 1
fi
echo "✅ Utilisateur créé : $USER_ID"

echo "=== Création d'un produit test ==="
PRODUCT_JSON=$(test_post "products" '{"name":"Produit Auto","price":1000,"stock":10}')
PRODUCT_ID=$(echo $PRODUCT_JSON | grep -oP '(?<="id":")[^"]+')
if [ -z "$PRODUCT_ID" ]; then
    echo "❌ Échec création produit. Arrêt du script."
    cleanup
    exit 1
fi
echo "✅ Produit créé : $PRODUCT_ID"

echo "=== Création d'un client test ==="
CLIENT_JSON=$(test_post "clients" "{\"name\":\"Client Auto\",\"email\":\"$CLIENT_EMAIL\"}")
CLIENT_ID=$(echo $CLIENT_JSON | grep -oP '(?<="id":")[^"]+')
if [ -z "$CLIENT_ID" ]; then
    echo "❌ Échec création client. Arrêt du script."
    cleanup
    exit 1
fi
echo "✅ Client créé : $CLIENT_ID"

# =========================
# Création d'une commande test
# =========================
echo "=== Création d'une commande test ==="
ORDER_JSON=$(test_post "orders" "{\"clientId\":\"$CLIENT_ID\",\"products\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}]}")
ORDER_ID=$(echo $ORDER_JSON | grep -oP '(?<="id":")[^"]+')
if [ -z "$ORDER_ID" ]; then
    echo "❌ Échec création commande. Arrêt du script."
    cleanup
    exit 1
fi
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
cleanup

echo "=== Test complet automatique terminé ✅ ==="

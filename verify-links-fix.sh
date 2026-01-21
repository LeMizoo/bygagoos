#!/bin/bash
# 🔍 Script de Vérification - Liens Morts Frontend

echo "🔍 Vérification des Corrections de Liens Morts"
echo "=============================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0
CHECKS=0

# Fonction pour vérifier un fichier
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Fichier trouvé: $1"
        ((CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC} Fichier MANQUANT: $1"
        ((ERRORS++))
        return 1
    fi
}

# Fonction pour vérifier la présence d'une chaîne
check_content() {
    FILE=$1
    PATTERN=$2
    if grep -q "$PATTERN" "$FILE" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((CHECKS++))
    else
        echo -e "${RED}✗${NC} $3 (MANQUANT)"
        ((ERRORS++))
    fi
}

# Fonction pour vérifier l'absence d'une chaîne
check_not_content() {
    FILE=$1
    PATTERN=$2
    if ! grep -q "$PATTERN" "$FILE" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((CHECKS++))
    else
        echo -e "${YELLOW}⚠${NC} $3 (TROUVÉ)"
        ((WARNINGS++))
    fi
}

echo "📂 VÉRIFICATION DES FICHIERS"
echo "---"
check_file "frontend/src/pages/admin/orders/OrderDetailsPage.jsx"
check_file "frontend/src/pages/admin/orders/OrderDetailsPage.css"
echo ""

echo "🔗 VÉRIFICATION DES ROUTES"
echo "---"
check_content "frontend/src/App.jsx" "path=\"/orders/new\"" "Route /admin/orders/new"
check_content "frontend/src/App.jsx" "path=\"/orders/:id\"" "Route /admin/orders/:id"
check_content "frontend/src/App.jsx" "path=\"/orders/:id/edit\"" "Route /admin/orders/:id/edit"
echo ""

echo "🔑 VÉRIFICATION DES CLÉS LOCALSTORAGE"
echo "---"
check_content "frontend/src/context/AuthContext.jsx" "bygagoos_token" "AuthContext utilise bygagoos_token"
check_content "frontend/src/context/AuthContext.jsx" "bygagoos_user" "AuthContext utilise bygagoos_user"
check_not_content "frontend/src/pages/admin/dashboard/DashboardPage.jsx" "localStorage.getItem('user')" "DashboardPage ne utilise pas 'user'"
check_not_content "frontend/src/pages/admin/ProfilePage.jsx" "localStorage.getItem('user')" "ProfilePage ne utilise pas 'user'"
check_not_content "frontend/src/components/layout/AdminSidebar.jsx" "token'" "AdminSidebar ne utilise pas 'token'"
echo ""

echo "🚫 VÉRIFICATION DES ROUTES ORPHELINES"
echo "---"
check_not_content "frontend/src/components/layout/AdminSidebar.jsx" "/admin/production/logistics" "Route /admin/production/logistics supprimée"
check_not_content "frontend/src/pages/admin/orders/OrdersNewPage.jsx" "'/app/dashboard'" "OrdersNewPage ne redirige pas vers /app/dashboard"
check_not_content "frontend/src/components/AuthChecker.jsx" "location.pathname.startsWith('/app/')" "AuthChecker ne cherche plus /app/"
echo ""

echo "📝 VÉRIFICATION DES REDIRECTIONS"
echo "---"
check_content "frontend/src/pages/admin/orders/OrdersNewPage.jsx" "navigate('/admin/dashboard')" "OrdersNewPage redirige vers /admin/dashboard"
check_content "frontend/src/pages/admin/orders/OrdersNewPage.jsx" "navigate('/admin/orders')" "OrdersNewPage bouton retour vers /admin/orders"
echo ""

echo "=============================================="
echo ""
echo -e "📊 RÉSULTATS:"
echo -e "   ${GREEN}✓ Vérifications réussies: ${CHECKS}${NC}"
if [ $WARNINGS -gt 0 ]; then
    echo -e "   ${YELLOW}⚠ Avertissements: ${WARNINGS}${NC}"
fi
if [ $ERRORS -gt 0 ]; then
    echo -e "   ${RED}✗ Erreurs trouvées: ${ERRORS}${NC}"
    exit 1
else
    echo -e "   ${GREEN}🎉 Aucune erreur détectée!${NC}"
    exit 0
fi

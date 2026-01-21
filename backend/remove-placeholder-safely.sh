#!/bin/bash
echo "��� SUPPRESSION SÉCURISÉE DU PLACEHOLDER"
echo "========================================"

FILE="app.js"
BACKUP="${FILE}.backup-$(date +%s)"

# Créer une copie de sécurité
cp "$FILE" "$BACKUP"
echo "✅ Backup créé: $BACKUP"

# Trouver les lignes exactes du placeholder
echo ""
echo "Recherche du placeholder..."

# Méthode 1: Trouver par le texte unique
START_PATTERN="// PLACEHOLDER AUTH FOR VERCEL DEPLOYMENT"
END_PATTERN="next();"

if grep -q "$START_PATTERN" "$FILE"; then
    echo "✅ Pattern de début trouvé"
    
    # Trouver la ligne de début
    START_LINE=$(grep -n "$START_PATTERN" "$FILE" | cut -d: -f1)
    
    # Trouver la ligne de fin (8 lignes après le début)
    END_LINE=$((START_LINE + 8))
    
    echo "   Ligne début: $START_LINE"
    echo "   Ligne fin estimée: $END_LINE"
    
    echo ""
    echo "=== CONTENU À SUPPRIMER ==="
    sed -n "${START_LINE},${END_LINE}p" "$FILE"
    
    echo ""
    read -p "Confirmer la suppression de ces lignes? (o/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        # Supprimer les lignes
        sed -i "${START_LINE},${END_LINE}d" "$FILE"
        echo "✅ Placeholder supprimé"
        
        # Vérifier
        echo ""
        echo "=== VÉRIFICATION APRÈS SUPPRESSION ==="
        echo "Lignes 115-125 après suppression:"
        sed -n '115,125p' "$FILE"
    else
        echo "❌ Suppression annulée"
        exit 1
    fi
else
    echo "⚠️  Placeholder non trouvé avec le pattern standard"
    echo "Tentative avec d'autres patterns..."
    
    # Chercher d'autres patterns
    if grep -n "demo-token-vercel" "$FILE"; then
        echo "✅ Trouvé 'demo-token-vercel'"
        LINE=$(grep -n "demo-token-vercel" "$FILE" | head -1 | cut -d: -f1)
        echo "   À la ligne: $LINE"
        
        echo ""
        echo "Lignes $((LINE-5)) à $((LINE+5)):"
        sed -n "$((LINE-5)),$((LINE+5))p" "$FILE"
        
        echo ""
        read -p "Supprimer manuellement? (o/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Oo]$ ]]; then
            echo "��� Ouvrez app.js avec nano et supprimez le bloc manuellement:"
            echo "   nano app.js"
            echo "   Aller à la ligne $LINE"
            echo "   Supprimer le bloc de code placeholder"
            exit 0
        fi
    else
        echo "ℹ️  Aucun placeholder trouvé - peut-être déjà supprimé"
    fi
fi

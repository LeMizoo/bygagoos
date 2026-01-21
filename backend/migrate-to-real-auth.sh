#!/bin/bash
echo "Ì¥ê MIGRATION VERS AUTHENTIFICATION R√âELLE"
echo "==========================================="
echo "D√©but: $(date)"
echo ""

# 1. Backup de l'actuel app.js
echo "1. Ì≥Å Backup du fichier app.js..."
cp app.js "app.js.backup-before-real-auth-$(date +%Y%m%d-%H%M%S)"
echo "‚úÖ Backup cr√©√©"

# 2. V√©rifier le placeholder actuel
echo ""
echo "2. Ì¥ç Analyse du placeholder actuel..."
if grep -n "demo-token-vercel" app.js; then
    echo "‚úÖ Placeholder trouv√©"
    START_LINE=$(grep -n "// PLACEHOLDER AUTH FOR VERCEL DEPLOYMENT" app.js | cut -d: -f1)
    if [ ! -z "$START_LINE" ]; then
        echo "   Ligne de d√©but: $START_LINE"
    fi
else
    echo "‚ö†Ô∏è  Placeholder non trouv√© - peut-√™tre d√©j√† supprim√©"
fi

# 3. V√©rifier la base de donn√©es
echo ""
echo "3. Ì∑ÉÔ∏è  V√©rification de la base de donn√©es..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('Ì¥ç Connexion √† la base de donn√©es...');
        
        // Test de connexion
        await prisma.\$connect();
        console.log('‚úÖ Connexion DB r√©ussie');
        
        // Compter les utilisateurs
        const userCount = await prisma.user.count();
        console.log(\`Ì±• Nombre d'utilisateurs: \${userCount}\`);
        
        // Lister les utilisateurs
        if (userCount > 0) {
            const users = await prisma.user.findMany({
                select: { email: true, role: true, name: true }
            });
            console.log('Ì≥ã Liste des utilisateurs:');
            users.forEach(u => console.log(\`   - \${u.email} (\${u.role}): \${u.name}\`));
        }
        
        return userCount;
    } catch (error) {
        console.error('‚ùå Erreur DB:', error.message);
        return 0;
    } finally {
        await prisma.\$disconnect();
    }
}

checkDatabase().then(count => {
    if (count === 0) {
        console.log('‚ö†Ô∏è  Base vide - cr√©ation admin n√©cessaire');
    }
});
"

echo ""
echo "4. ‚è≥ Pause pour v√©rification..."
read -p "   Voulez-vous continuer? (o/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "‚ùå Migration annul√©e"
    exit 1
fi

# Ex√©cuter les √©tapes suivantes seulement si l'utilisateur confirme
echo "‚úÖ Continuons..."

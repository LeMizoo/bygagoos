#!/bin/bash
echo "��� Débogage du backend..."
echo "========================="

# Vérifier le processus sur le port 5000
echo "1. Vérification du port 5000:"
netstat -an | grep 5000 || echo "Port 5000 non utilisé"

# Vérifier app.js
echo ""
echo "2. Vérification de app.js:"
cd backend
echo "   PORT utilisé:"
grep "PORT" app.js
echo ""
echo "   Dernières lignes de app.js:"
tail -20 app.js

# Tester directement avec Node
echo ""
echo "3. Test direct avec Node:"
if node -c app.js; then
    echo "   ✅ Syntaxe OK"
    echo "   Lancement test rapide..."
    timeout 3 node app.js &
    sleep 2
    curl -s http://localhost:5000/api/health || echo "   ❌ Ne répond pas"
    pkill -f "node app.js"
else
    echo "   ❌ Erreur de syntaxe"
fi

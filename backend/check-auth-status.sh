#!/bin/bash
echo "��� ÉTAT ACTUEL DE L'AUTHENTIFICATION"
echo "====================================="

echo ""
echo "1. ��� Placeholder dans app.js:"
if grep -q "demo-token-vercel" app.js; then
  echo "   ✅ MODE DÉMO ACTIF"
  echo "   ��� Login: n'importe quel email/mot de passe"
  echo "   ��� Solution: Supprimer lignes 119-126 pour vraie auth"
else
  echo "   ✅ VRAIE AUTHENTIFICATION ACTIVE"
fi

echo ""
echo "2. ���️  Base de données:"
if [ -f "prisma/dev.db" ]; then
  USER_COUNT=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
  echo "   Utilisateurs: $USER_COUNT"
  if [ "$USER_COUNT" -gt 0 ]; then
    echo "   ��� Liste:"
    sqlite3 prisma/dev.db "SELECT email, name, role FROM User LIMIT 3;" 2>/dev/null || echo "   Impossible de lire"
  fi
else
  echo "   ❌ Pas de base de données SQLite"
fi

echo ""
echo "3. ��� Test en direct:"
echo "   Test login démo:"
curl -s -X POST https://bygagoos-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | jq -r '.message // "ERROR"' 2>/dev/null

echo ""
echo "��� RECOMMANDATION:"
if grep -q "demo-token-vercel" app.js; then
  echo "   Utilisez n'importe quel email/mot de passe pour le login démo"
else
  echo "   Essayez: admin@bygagoos.com / admin123"
fi

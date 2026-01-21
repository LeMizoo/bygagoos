#!/bin/bash
echo "í¾¯ DÃ©marrage simplifiÃ© ByGagoos-Ink"
echo "=================================="

# ArrÃªter tout processus existant
echo "1. Nettoyage des anciens processus..."
pkill -f "node app.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# DÃ©marrer backend
echo "2. DÃ©marrage backend..."
cd backend
echo "   Port: 5000"
echo "   URL API: http://localhost:5000/api"
echo "   Health check: http://localhost:5000/api/health"
node app.js &
BACKEND_PID=$!
cd ..

# Attendre 3 secondes
sleep 3

# Tester le backend
echo "3. Test du backend..."
if curl -s http://localhost:5000/api/health >/dev/null; then
    echo "   âœ… Backend fonctionne!"
else
    echo "   âŒ Backend ne rÃ©pond pas"
    echo "   Essayez manuellement: cd backend && node app.js"
    exit 1
fi

# DÃ©marrer frontend
echo "4. DÃ©marrage frontend..."
cd frontend
echo "   Port: 5173"
echo "   URL: http://localhost:5173"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "âœ… Services dÃ©marrÃ©s!"
echo "í´— Frontend: http://localhost:5173"
echo "í´— Backend:  http://localhost:5000"
echo "í´— API Health: http://localhost:5000/api/health"
echo ""
echo "í»‘ Pour arrÃªter: Appuyez sur Ctrl+C"
echo ""

trap "echo 'ArrÃªt...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait

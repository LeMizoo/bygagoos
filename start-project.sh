#!/bin/bash
echo "Ì∫Ä D√©marrage de BYGAGOOS INK"
echo "============================="

# Arr√™ter les processus existants
echo "Ì¥ß Arr√™t des processus existants..."
pkill -f "node.*app.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# D√©marrer le backend
echo ""
echo "Ì≥¶ D√©marrage du backend (port 3002)..."
cd backend
npm start &
BACKEND_PID=$!
echo "‚úÖ Backend d√©marr√© (PID: $BACKEND_PID)"
sleep 3

# Tester le backend
echo "Ì¥ç Test du backend..."
curl -s http://localhost:3002/ | grep -o '"message":"[^"]*"' || echo "‚ö†Ô∏è  Backend non accessible"

# D√©marrer le frontend
echo ""
echo "Ìæ® D√©marrage du frontend (port 5173)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "‚úÖ Frontend d√©marr√© (PID: $FRONTEND_PID)"
sleep 5

echo ""
echo "‚úÖ SYST√àME D√âMARR√â !"
echo "==================="
echo "Ì≥ç Backend API:  http://localhost:3002"
echo "Ì≥ç Frontend App: http://localhost:5173"
echo ""
echo "Ì¥ë Identifiants de test:"
echo "   ‚Ä¢ Admin:  admin@bygagoos.mg / admin123"
echo "   ‚Ä¢ Client: client@bygagoos.mg / client123"
echo ""
echo "Ì≥å Pages principales:"
echo "   ‚Ä¢ Accueil:        http://localhost:5173"
echo "   ‚Ä¢ Connexion:      http://localhost:5173/login"
echo "   ‚Ä¢ Dashboard:      http://localhost:5173/admin/dashboard"
echo "   ‚Ä¢ Production:     http://localhost:5173/admin/production"
echo ""
echo "Ìªë Pour arr√™ter: Appuyez sur Ctrl+C"
echo ""
wait

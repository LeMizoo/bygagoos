#!/bin/bash
echo "í´§ Correction et lancement de ByGagoos-Ink..."
echo "============================================"

# 1. Corriger l'import dans app.js
echo "1. Correction de l'import backend..."
sed -i 's/\.\/routes\/productionRoutes/\.\/routes\/production/g' backend/app.js
echo "   âœ… Import corrigÃ©: productionRoutes â†’ production"

# 2. Corriger le script dev frontend
echo "2. Correction du frontend..."
cd frontend

# VÃ©rifier et corriger package.json
if grep -q "copy-images.cjs" package.json; then
    echo "   Correction du script dev..."
    npm pkg set scripts.dev="vite"
    echo "   âœ… Script dev corrigÃ©"
fi

# CrÃ©er vite.config.js si manquant
if [ ! -f "vite.config.js" ]; then
    echo "   CrÃ©ation de vite.config.js..."
    cat > vite.config.js << 'CONFIGEOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
CONFIGEOF
    echo "   âœ… vite.config.js crÃ©Ã©"
fi

cd ..

# 3. Lancer les services
echo "3. Lancement des services..."
echo ""
echo "í³‹ OUVREZ DEUX TERMINAUX :"
echo ""
echo "TERMINAL 1 (Backend):"
echo "-------------------"
echo "cd backend"
echo "npm install"
echo "npm run dev"
echo ""
echo "TERMINAL 2 (Frontend):"
echo "--------------------"
echo "cd frontend"
echo "npm install"
echo "npm run dev"
echo ""
echo "í´— URLs une fois dÃ©marrÃ©:"
echo "â€¢ Frontend: http://localhost:5173"
echo "â€¢ Backend:  http://localhost:5000"
echo "â€¢ API Health: http://localhost:5000/api/health"
echo ""
echo "í·ª Test rapide aprÃ¨s dÃ©marrage:"
echo "curl http://localhost:5000/api/health"
echo ""
echo "íº€ Pour dÃ©ployer sur Vercel aprÃ¨s test:"
echo "1. backend fonctionne? â†’ Configurer bygagoos-api.vercel.app"
echo "2. frontend fonctionne? â†’ Configurer bygagoos-ink.vercel.app"

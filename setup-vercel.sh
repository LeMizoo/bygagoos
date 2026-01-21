#!/bin/bash
echo "================================================"
echo "CONFIGURATION VERCEL"
echo "================================================"

echo ""
echo "1. Configuration backend..."
cd backend

cat > vercel.json << 'VERCEL_EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ],
  "env": {
    "DATABASE_URL": "file:./dev.db",
    "NODE_ENV": "production"
  }
}
VERCEL_EOF

echo ""
echo "2. Mise à jour package.json pour Vercel..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts['vercel-build'] = 'npm install && npx prisma generate';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo ""
echo "3. Configuration frontend..."
cd ../frontend

if [ -f "src/services/api.js" ]; then
  sed -i.bak 's|http://localhost:5000|https://bygagoos-api.vercel.app|g' src/services/api.js
  echo "✅ URL API mise à jour"
fi

cat > vercel.json << 'FRONTEND_EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
FRONTEND_EOF

echo ""
echo "================================================"
echo "✅ CONFIGURATION VERCEL TERMINÉE"
echo "================================================"
echo "Pour déployer:"
echo "Backend: cd backend && vercel --prod"
echo "Frontend: cd frontend && npm run build && vercel --prod"

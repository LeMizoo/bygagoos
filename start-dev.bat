@echo off
echo 🚀 Démarrage de ByGagoos Ink...
echo.

echo 🛑 Nettoyage des ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    echo Arrêt du processus %%a sur le port 3002
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Arrêt du processus %%a sur le port 5173
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo 📦 Démarrage du backend...
start "Backend" cmd /k "cd /d E:\ByGagoos-Ink\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 🌐 Démarrage du frontend...
start "Frontend" cmd /k "cd /d E:\ByGagoos-Ink\frontend && npm run dev"

echo.
echo ✅ Services démarrés !
echo 📊 Backend: http://localhost:3002
echo 🎨 Frontend: http://localhost:5173
echo.
echo Les services tournent dans des fenêtres séparées.
echo Fermez les fenêtres pour arrêter les services.
echo.
pause
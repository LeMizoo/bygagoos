# Démarrage de ByGagoos Ink - Script PowerShell Simplifié
Write-Host "🚀 Démarrage de ByGagoos Ink..." -ForegroundColor Green

# Fonction pour arrêter les processus sur un port
function Stop-Port {
    param([int]$port)
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        if ($conn.State -eq "Listen") {
            Write-Host "🛑 Arrêt du processus $($conn.OwningProcess) sur le port $port" -ForegroundColor Yellow
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

# Nettoyer les ports
Stop-Port 3002
Stop-Port 5173

# Attendre un peu
Start-Sleep -Seconds 2

# Démarrer le backend en arrière-plan
Write-Host "📦 Démarrage du backend..." -ForegroundColor Blue
Start-Process -FilePath "cmd" -ArgumentList "/c cd /d E:\ByGagoos-Ink\backend && npm run dev" -NoNewWindow

Start-Sleep -Seconds 3

# Démarrer le frontend en arrière-plan
Write-Host "🌐 Démarrage du frontend..." -ForegroundColor Blue
Start-Process -FilePath "cmd" -ArgumentList "/c cd /d E:\ByGagoos-Ink\frontend && npm run dev" -NoNewWindow

Write-Host "✅ Services démarrés !" -ForegroundColor Green
Write-Host "📊 Backend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Les services tournent en arrière-plan. Utilisez Ctrl+C dans leurs terminaux respectifs pour les arrêter." -ForegroundColor Yellow
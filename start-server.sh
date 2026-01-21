#!/bin/bash
echo "Ì¥ß D√©marrage s√©curis√© du serveur..."

# 1. Tuer tous les processus Node
echo "Ìªë Arr√™t des anciens processus..."
taskkill /F /IM node.exe 2>/dev/null || echo "Aucun processus √† arr√™ter"
sleep 3

# 2. V√©rifier le port
echo "Ì¥ç V√©rification du port 3002..."
netstat -ano | findstr :3002 && echo "‚ö†Ô∏è  Port encore utilis√©" || echo "‚úÖ Port libre"

# 3. D√©marrer le serveur
echo "Ì∫Ä D√©marrage du serveur..."
node server.js &
SERVER_PID=$!
echo "Ì≥å PID: $SERVER_PID"

# 4. Attendre
sleep 5

# 5. Tester
echo "Ì∑™ Test de connexion..."
curl http://localhost:3002/health -w " (%{http_code})\n" -s || echo "‚ùå Serveur non d√©marr√©"

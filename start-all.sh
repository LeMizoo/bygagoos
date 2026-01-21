#!/bin/bash

# ============================================
# Script de démarrage ByGagoos Ink
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "==========================================="
echo "   🚀 DÉMARRAGE BYGAGOOS INK"
echo "==========================================="
echo -e "${NC}"

show_menu() {
    echo -e "\n${YELLOW}Choisissez une option :${NC}"
    echo "1. 🔧 Mode Docker (recommandé)"
    echo "2. 🖥️  Mode Manuel"
    echo "3. 📊 Vérifier les services"
    echo "4. 🗑️  Nettoyer et arrêter"
    echo "5. 🚪 Quitter"
    echo -n "Votre choix [1-5]: "
}

check_services() {
    echo -e "\n${BLUE}🔍 Vérification des services...${NC}"
    
    # Vérifier MongoDB
    if docker ps | grep -q "bygagoos-mongodb"; then
        echo -e "${GREEN}✅ MongoDB est en cours d'exécution${NC}"
    else
        echo -e "${RED}❌ MongoDB n'est pas démarré${NC}"
    fi
    
    # Vérifier Backend
    if curl -s http://localhost:3002/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend API est en cours d'exécution${NC}"
    else
        echo -e "${RED}❌ Backend API n'est pas démarré${NC}"
    fi
    
    # Vérifier Frontend
    if curl -s http://localhost:5173 > /dev/null; then
        echo -e "${GREEN}✅ Frontend est en cours d'exécution${NC}"
    else
        echo -e "${RED}❌ Frontend n'est pas démarré${NC}"
    fi
}

start_docker() {
    echo -e "\n${BLUE}🐳 Démarrage avec Docker...${NC}"
    
    # Vérifier si Docker est installé
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker n'est pas installé${NC}"
        echo "Installez Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Vérifier si Docker Compose est disponible
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
        exit 1
    fi
    
    # Démarrer les services
    echo "Démarrage des services en arrière-plan..."
    
    # Utiliser docker-compose ou docker compose
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✅ Services démarrés avec succès !${NC}"
        echo -e "\n${YELLOW}📊 Services disponibles :${NC}"
        echo "   MongoDB:      http://localhost:27017"
        echo "   Backend API:  http://localhost:3002/api"
        echo "   Frontend:     http://localhost:5173"
        echo -e "\n${YELLOW}👤 Comptes de démo :${NC}"
        echo "   Admin:  admin@bygagoos.mg / Admin@2024"
        echo "   User:   demo@bygagoos.mg / demo123"
        
        # Attendre que les services soient prêts
        echo -e "\n${BLUE}⏳ Attente du démarrage des services...${NC}"
        sleep 5
        
        # Initialiser la base de données
        echo "Initialisation de la base de données..."
        docker exec -it bygagoos-backend npm run seed
        
    else
        echo -e "${RED}❌ Erreur lors du démarrage des services${NC}"
    fi
}

start_manual() {
    echo -e "\n${BLUE}🖥️  Démarrage manuel...${NC}"
    
    echo -e "${YELLOW}Ouvrez 3 terminaux séparés :${NC}"
    echo -e "\n${GREEN}Terminal 1 - MongoDB:${NC}"
    echo "docker run --name bygagoos-mongodb -p 27017:27017 -d mongo:latest"
    
    echo -e "\n${GREEN}Terminal 2 - Backend:${NC}"
    echo "cd backend"
    echo "npm install"
    echo "npm run build"
    echo "npm run seed"
    echo "npm run dev"
    
    echo -e "\n${GREEN}Terminal 3 - Frontend:${NC}"
    echo "cd frontend"
    echo "npm install"
    echo "npm run dev"
    
    echo -e "\n${YELLOW}⚠️  Assurez-vous que MongoDB est démarré avant le backend !${NC}"
}

cleanup() {
    echo -e "\n${BLUE}🧹 Nettoyage...${NC}"
    
    # Arrêter et supprimer les conteneurs
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        docker compose down
    fi
    
    # Supprimer les volumes
    docker volume rm -f $(docker volume ls -q | grep bygagoos) 2>/dev/null || true
    
    echo -e "${GREEN}✅ Nettoyage terminé${NC}"
}

# Menu principal
while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            start_docker
            ;;
        2)
            start_manual
            ;;
        3)
            check_services
            ;;
        4)
            cleanup
            ;;
        5)
            echo -e "\n${BLUE}👋 Au revoir !${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Choix invalide${NC}"
            ;;
    esac
    
    echo -e "\n${BLUE}-------------------------------------------${NC}"
done
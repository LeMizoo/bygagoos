FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Installer Prisma CLI globalement pour les migrations
RUN npm install -g prisma

# Copier le reste du code
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port
EXPOSE 5000

# Démarrer l'application
CMD ["npx", "prisma", "migrate", "deploy", "&&", "npm", "start"]

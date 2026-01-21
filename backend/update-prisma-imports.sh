#!/bin/bash

# Mettre à jour les imports dans tous les fichiers backend

echo "Mise à jour des imports Prisma..."

# Remplacer les imports Mongoose par Prisma
find ./backend -name "*.js" -type f ! -path "./node_modules/*" -exec sed -i.bak '
  s/const mongoose = require("mongoose")/const { PrismaClient } = require("@prisma-client")\nconst prisma = new PrismaClient()/g;
  s/mongoose\.connection\./prisma\./g;
  s/mongoose\.model(/await prisma./g;
  s/\.save()/.create({ data: ... })/g;
  s/\.find(/\.findMany({/g;
  s/\.findById(/\.findUnique({ where: { id: /g;
  s/\.findOne(/\.findFirst({/g;
' {} \;

echo "✅ Imports mis à jour"

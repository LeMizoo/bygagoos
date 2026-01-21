// backend/test-login.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin(email, password) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`❌ Utilisateur introuvable pour l'email: ${email}`);
      return;
    }

    console.log('ℹ️ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordHash: user.password ? user.password.slice(0, 10) + '...' : null
    });

    if (!user.password) {
      console.log('❌ Aucun mot de passe stocké pour cet utilisateur');
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      console.log('✅ Mot de passe correct ! Login OK.');
    } else {
      console.log('❌ Mot de passe incorrect.');
    }

  } catch (err) {
    console.error('❌ Erreur lors du test login:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// === MODIFIER ICI POUR TESTER LES COMPTES ===
const email = 'admin@bygagoos.mg';
const password = 'Admin123!';

testLogin(email, password);

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    const email = 'admin@bygagoos.mg';
    const newPassword = 'admin123';

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log('✅ Mot de passe admin réinitialisé');
    console.log('📧 Email:', user.email);
    console.log('🔑 Nouveau mot de passe:', newPassword);
  } catch (error) {
    console.error('❌ Erreur reset admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

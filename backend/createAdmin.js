const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    const email = 'admin@bygagoos.mg';
    const password = 'admin123';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'Administrateur ByGagoos',
        email,
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ Admin créé avec succès');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);

  } catch (error) {
    console.error('❌ Erreur création admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

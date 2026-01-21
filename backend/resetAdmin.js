const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.user.delete({ where: { email: 'admin@bygagoos.mg' } });
  console.log('Admin supprimé avec succès !');
  await prisma.$disconnect();
})();

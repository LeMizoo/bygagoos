const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seed de la base de données...');

  try {
    // Vider les tables (optionnel, pour tests)
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await prisma.consumable.deleteMany();

    console.log('✅ Tables nettoyées');

    // 1. Créer utilisateur admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@bygagoos.com',
        password: adminPassword,
        name: 'Administrateur ByGagoos',
        role: 'admin'
      }
    });
    console.log('✅ Utilisateur admin créé');

    // 2. Créer utilisateur test
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'user@bygagoos.com',
        password: userPassword,
        name: 'Utilisateur Test',
        role: 'user'
      }
    });
    console.log('✅ Utilisateur test créé');

    // 3. Créer des clients
    const client1 = await prisma.client.create({
      data: {
        name: 'Entreprise Malagasy',
        email: 'contact@malagasy.mg',
        phone: '+261 34 12 34 567',
        address: 'Antananarivo 101'
      }
    });

    const client2 = await prisma.client.create({
      data: {
        name: 'Boutique Tana',
        email: 'boutique@tana.mg',
        phone: '+261 33 12 34 567',
        address: 'Analakely'
      }
    });
    console.log('✅ Clients créés');

    // 4. Créer des produits
    const products = await prisma.product.createMany({
      data: [
        {
          name: 'T-shirt ByGagoos Blanc',
          description: 'T-shirt 100% coton avec logo ByGagoos',
          price: 29.99,
          category: 'Vêtements',
          stock: 150,
          imageUrl: '/images/tshirt-blanc.jpg'
        },
        {
          name: 'T-shirt ByGagoos Noir',
          description: 'T-shirt noir premium qualité',
          price: 34.99,
          category: 'Vêtements',
          stock: 100,
          imageUrl: '/images/tshirt-noir.jpg'
        },
        {
          name: 'Stickers Pack Spécial',
          description: 'Pack de 15 stickers vinyl haute qualité',
          price: 19.99,
          category: 'Accessoires',
          stock: 200,
          imageUrl: '/images/stickers.jpg'
        },
        {
          name: 'Flyers Promotionnels',
          description: 'Flyers A5 papier brillant 150g',
          price: 0.35,
          category: 'Impression',
          stock: 5000
        },
        {
          name: 'Cartes de Visite',
          description: 'Cartes de visite premium',
          price: 0.50,
          category: 'Impression',
          stock: 3000
        }
      ]
    });
    console.log('✅ Produits créés');

    // 5. Créer une commande de test
    const order = await prisma.order.create({
      data: {
        orderNumber: 'CMD-' + Date.now(),
        clientId: client1.id,
        status: 'completed',
        totalAmount: 79.97,
        notes: 'Première commande de test',
        items: {
          create: [
            {
              productId: (await prisma.product.findFirst({ where: { name: 'T-shirt ByGagoos Blanc' } })).id,
              quantity: 2,
              price: 29.99
            },
            {
              productId: (await prisma.product.findFirst({ where: { name: 'Stickers Pack Spécial' } })).id,
              quantity: 1,
              price: 19.99
            }
          ]
        }
      }
    });
    console.log('✅ Commande créée');

    // 6. Créer des consommables
    await prisma.consumable.createMany({
      data: [
        {
          name: 'Encre Noire Cyan',
          description: 'Encre cyan pour sérigraphie',
          quantity: 25,
          unit: 'Litre',
          minStock: 10
        },
        {
          name: 'Encre Magenta',
          description: 'Encre magenta haute pigmentation',
          quantity: 18,
          unit: 'Litre',
          minStock: 8
        },
        {
          name: 'Encre Jaune',
          description: 'Encre jaune brillante',
          quantity: 22,
          unit: 'Litre',
          minStock: 10
        },
        {
          name: 'Papier A4 90g',
          description: 'Papier pour impression laser',
          quantity: 8500,
          unit: 'Feuilles',
          minStock: 2000
        },
        {
          name: 'Encres UV',
          description: 'Encres séchage UV',
          quantity: 8,
          unit: 'Litre',
          minStock: 5
        }
      ]
    });
    console.log('✅ Consommables créés');

    console.log('');
    console.log('��� SEED TERMINÉ AVEC SUCCÈS !');
    console.log('');
    console.log('��� DONNÉES CRÉÉES:');
    console.log('- 2 utilisateurs (admin/user)');
    console.log('- 2 clients');
    console.log('- 5 produits');
    console.log('- 1 commande avec items');
    console.log('- 5 consommables');
    console.log('');
    console.log('��� IDENTIFIANTS DE TEST:');
    console.log('Admin: admin@bygagoos.com / admin123');
    console.log('User: user@bygagoos.com / user123');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed échoué:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

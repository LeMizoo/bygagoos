const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  // Créer un utilisateur familial
  static async createFamilyMember(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    return await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role || 'FAMILY_MEMBER',
        familyRole: userData.familyRole,
        mustChangePassword: true,
        isActive: true
      }
    });
  }

  // Trouver par email
  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  // Trouver par ID
  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        familyRole: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });
  }

  // Vérifier le mot de passe
  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  // Générer un token JWT
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        familyRole: user.familyRole
      },
      process.env.JWT_SECRET || 'bygagoos-secret-key',
      { expiresIn: '24h' }
    );
  }

  // Mettre à jour le dernier login
  static async updateLastLogin(id) {
    return await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    });
  }

  // Obtenir tous les membres familiaux
  static async getAllFamilyMembers() {
    return await prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        familyRole: true,
        avatar: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: {
        lastName: 'asc'
      }
    });
  }

  // Mettre à jour le profil
  static async updateProfile(id, updateData) {
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
    const dataToUpdate = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    });

    return await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });
  }

  // Changer le mot de passe
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });
  }

  // Obtenir les statistiques utilisateurs
  static async getStats() {
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    });
    
    const superAdmins = await prisma.user.count({
      where: { 
        isActive: true,
        role: 'SUPER_ADMIN'
      }
    });
    
    const admins = await prisma.user.count({
      where: { 
        isActive: true,
        role: 'ADMIN'
      }
    });

    return {
      totalUsers,
      superAdmins,
      admins,
      familyMembers: totalUsers - superAdmins - admins
    };
  }
}

module.exports = User;

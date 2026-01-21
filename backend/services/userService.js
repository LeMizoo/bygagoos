const prisma = require('./prisma');
const bcrypt = require('bcryptjs');

class UserService {
  async findByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'user'
      }
    });
  }

  async update(id, userData) {
    const data = { ...userData };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return await prisma.user.update({ where: { id }, data });
  }

  async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }
}

module.exports = new UserService();

const prisma = require('./prisma');

class ClientService {
  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ]);

    return { clients, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return await prisma.client.findUnique({
      where: { id }
    });
  }

  async findByEmail(email) {
    return await prisma.client.findUnique({
      where: { email }
    });
  }

  async create(clientData) {
    return await prisma.client.create({
      data: clientData
    });
  }

  async update(id, clientData) {
    return await prisma.client.update({
      where: { id },
      data: clientData
    });
  }

  async delete(id) {
    return await prisma.client.delete({
      where: { id }
    });
  }
}

module.exports = new ClientService();

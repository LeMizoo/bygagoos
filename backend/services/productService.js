const prisma = require('./prisma');

class ProductService {
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return { products, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return await prisma.product.findUnique({
      where: { id }
    });
  }

  async create(productData) {
    return await prisma.product.create({
      data: productData
    });
  }

  async update(id, productData) {
    return await prisma.product.update({
      where: { id },
      data: productData
    });
  }

  async delete(id) {
    return await prisma.product.delete({
      where: { id }
    });
  }

  async updateStock(id, quantity) {
    const product = await this.findById(id);
    return await prisma.product.update({
      where: { id },
      data: { stock: product.stock + quantity }
    });
  }
}

module.exports = new ProductService();

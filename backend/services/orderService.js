const prisma = require("./prisma");

class OrderService {
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.search) {
      where.orderNumber = {
        contains: filters.search,
        mode: "insensitive"
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: true,
          items: {
            include: { product: true }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: { product: true }
        }
      }
    });
  }

  async create(orderData) {
    const {
      clientId,
      clientName,
      phone,
      address,
      notes,
      items = []
    } = orderData;

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderNumber = `CMD-${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          clientId: clientId || null,
          clientName,
          phone,
          address,
          notes,
          totalAmount
        }
      });

      if (items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        });
      }

      return this.findById(order.id);
    });
  }

  async updateStatus(id, status) {
    return prisma.order.update({
      where: { id },
      data: { status }
    });
  }

  async delete(id) {
    return prisma.order.delete({
      where: { id }
    });
  }
}

module.exports = new OrderService();

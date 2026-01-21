const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/* =========================
   GET ALL PRODUCTS
========================= */
router.get('/', auth(), async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(products);
});

/* =========================
   CREATE PRODUCT (ADMIN)
========================= */
router.post('/', auth('admin'), async (req, res) => {
  const { name, price, stock, category, description, imageUrl } = req.body;

  const product = await prisma.product.create({
    data: {
      name,
      price: Number(price),
      stock: Number(stock) || 0,
      category,
      description,
      imageUrl
    }
  });

  res.status(201).json(product);
});

/* =========================
   UPDATE PRODUCT (ADMIN)
========================= */
router.put('/:id', auth('admin'), async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.update({
    where: { id },
    data: req.body
  });

  res.json(product);
});

/* =========================
   DELETE PRODUCT (ADMIN)
========================= */
router.delete('/:id', auth('admin'), async (req, res) => {
  const { id } = req.params;

  await prisma.product.delete({ where: { id } });
  res.json({ success: true });
});

module.exports = router;

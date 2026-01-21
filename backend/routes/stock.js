const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/* =========================
   GET STOCK
========================= */
router.get('/', auth(), async (req, res) => {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, stock: true }
  });
  res.json(products);
});

/* =========================
   UPDATE STOCK
========================= */
router.put('/:id', auth('admin'), async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { stock: Number(req.body.stock) }
  });

  res.json(product);
});

module.exports = router;

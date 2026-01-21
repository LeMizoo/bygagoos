const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/* =========================
   GET CLIENTS
========================= */
router.get('/', auth(), async (req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(clients);
});

/* =========================
   CREATE CLIENT
========================= */
router.post('/', auth(), async (req, res) => {
  const client = await prisma.client.create({ data: req.body });
  res.status(201).json(client);
});

/* =========================
   UPDATE CLIENT
========================= */
router.put('/:id', auth(), async (req, res) => {
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(client);
});

/* =========================
   DELETE CLIENT
========================= */
router.delete('/:id', auth('admin'), async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;

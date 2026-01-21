const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const orderService = require("../services/orderService");

/* =========================
   GET ALL ORDERS
========================= */
router.get("/", auth(), async (req, res) => {
  const { page, limit, status, search, clientId } = req.query;

  const result = await orderService.findAll(
    Number(page) || 1,
    Number(limit) || 10,
    { status, search, clientId }
  );

  res.json(result);
});

/* =========================
   GET ONE ORDER
========================= */
router.get("/:id", auth(), async (req, res) => {
  const order = await orderService.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

/* =========================
   CREATE ORDER
========================= */
router.post("/", auth(), async (req, res) => {
  const order = await orderService.create(req.body);
  res.status(201).json(order);
});

/* =========================
   UPDATE STATUS
========================= */
router.put("/:id/status", auth("admin"), async (req, res) => {
  const { status } = req.body;

  const order = await orderService.updateStatus(req.params.id, status);
  res.json(order);
});

/* =========================
   DELETE ORDER
========================= */
router.delete("/:id", auth("admin"), async (req, res) => {
  await orderService.delete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

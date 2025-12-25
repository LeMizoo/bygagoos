const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all clients
router.get('/', auth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      success: true,
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients'
    });
  }
});

// Get single client
router.get('/:id', auth, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({ success: true, client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client'
    });
  }
});

// Create client
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, address, company, notes } = req.body;

    const client = await prisma.client.create({
      data: { name, email, phone, address, company, notes }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_CLIENT',
        details: `Client créé: ${name}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      client
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Un client avec cet email existe déjà'
      });
    }
    
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du client'
    });
  }
});

// Update client
router.put('/:id', auth, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { name, email, phone, address, company, notes } = req.body;

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { name, email, phone, address, company, notes, updatedAt: new Date() }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_CLIENT',
        details: `Client mis à jour: ${name}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      client
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du client'
    });
  }
});

// Delete client
router.delete('/:id', auth, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    await prisma.client.delete({
      where: { id: clientId }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_CLIENT',
        details: `Client supprimé: ${client.name}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du client'
    });
  }
});

module.exports = router;
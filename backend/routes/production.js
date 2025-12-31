// backend/routes/production.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/production/tasks - Toutes les tâches avec filtres
router.get('/tasks', auth, async (req, res) => {
  try {
    const {
      status,
      type,
      assignedTo,
      orderId,
      date,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (assignedTo) where.assignedToId = parseInt(assignedTo);
    if (orderId) where.orderId = parseInt(orderId);
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      where.OR = [
        { startTime: { gte: startDate, lte: endDate } },
        { endTime: { gte: startDate, lte: endDate } },
        { createdAt: { gte: startDate, lte: endDate } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  company: true
                }
              },
              priority: true,
              deadline: true,
              status: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { order: { priority: 'desc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.task.count({ where })
    ]);

    // Statistiques
    const stats = {
      total,
      pending: await prisma.task.count({ where: { status: 'PENDING' } }),
      inProgress: await prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      completed: await prisma.task.count({ where: { status: 'COMPLETED' } }),
      cancelled: await prisma.task.count({ where: { status: 'CANCELLED' } })
    };

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    });

  } catch (error) {
    console.error('Get production tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tâches'
    });
  }
});

// POST /api/production/tasks - Créer une tâche
router.post('/tasks', auth, async (req, res) => {
  try {
    const {
      orderId,
      type = 'PRINTING',
      name,
      description,
      assignedToId,
      estimatedHours,
      notes
    } = req.body;

    // Vérifier la commande
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier l'employé si spécifié
    if (assignedToId) {
      const employee = await prisma.user.findUnique({
        where: { id: parseInt(assignedToId) }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employé non trouvé'
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        orderId: parseInt(orderId),
        type,
        name,
        description,
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        estimatedHours,
        notes,
        status: assignedToId ? 'PENDING' : 'PENDING'
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            client: true
          }
        },
        assignedTo: true
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_TASK',
        details: `Tâche créée: ${name} pour la commande ${order.orderNumber}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      data: task
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la tâche'
    });
  }
});

// PUT /api/production/tasks/:id/status - Mettre à jour le statut d'une tâche
router.put('/tasks/:id/status', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status, assignedToId, actualHours, notes } = req.body;

    // Vérifier la tâche
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        order: true
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Préparer les données de mise à jour
    const updateData = { status };
    const timelineNotes = [];

    // Gestion des dates selon le statut
    const now = new Date();
    
    if (status === 'IN_PROGRESS' && task.status !== 'IN_PROGRESS') {
      updateData.startTime = now;
      timelineNotes.push('Tâche démarrée');
    }
    
    if (status === 'COMPLETED' && task.status !== 'COMPLETED') {
      updateData.endTime = now;
      
      // Calculer les heures réelles si non spécifiées
      if (!actualHours && task.startTime) {
        const hoursDiff = (now - new Date(task.startTime)) / (1000 * 60 * 60);
        updateData.actualHours = Math.round(hoursDiff * 10) / 10;
      }
      
      timelineNotes.push('Tâche terminée');
    }
    
    if (actualHours !== undefined) {
      updateData.actualHours = actualHours;
    }
    
    if (assignedToId) {
      // Vérifier l'employé
      const employee = await prisma.user.findUnique({
        where: { id: parseInt(assignedToId) }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employé non trouvé'
        });
      }
      
      updateData.assignedToId = parseInt(assignedToId);
      timelineNotes.push(`Assignée à ${employee.firstName} ${employee.lastName}`);
    }
    
    // Ajouter les notes
    if (notes) {
      updateData.notes = task.notes ? `${task.notes}\n${now.toISOString()}: ${notes}` : `${now.toISOString()}: ${notes}`;
      timelineNotes.push(notes);
    }

    // Mettre à jour
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: true,
        order: {
          include: {
            client: true
          }
        }
      }
    });

    // Si toutes les tâches sont terminées, mettre à jour le statut de la commande
    if (status === 'COMPLETED') {
      const remainingTasks = await prisma.task.count({
        where: {
          orderId: task.orderId,
          status: { not: 'COMPLETED' }
        }
      });

      if (remainingTasks === 0) {
        await prisma.order.update({
          where: { id: task.orderId },
          data: { status: 'COMPLETED' }
        });
      }
    }

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_TASK_STATUS',
        details: `Statut tâche modifié: ${task.name} -> ${status}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: `Statut mis à jour: ${timelineNotes.join(', ')}`,
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// PUT /api/production/tasks/:id/assign - Assigner une tâche
router.put('/tasks/:id/assign', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { assignedToId } = req.body;

    // Vérifier la tâche
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier l'employé
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(assignedToId) }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé'
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: parseInt(assignedToId),
        status: task.status === 'PENDING' ? 'PENDING' : task.status
      },
      include: {
        assignedTo: true,
        order: {
          include: {
            client: true
          }
        }
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ASSIGN_TASK',
        details: `Tâche assignée: ${task.name} à ${employee.firstName} ${employee.lastName}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: `Tâche assignée à ${employee.firstName} ${employee.lastName}`,
      data: updatedTask
    });

  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation de la tâche'
    });
  }
});

// GET /api/production/dashboard - Tableau de bord production
router.get('/dashboard', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      todayTasks,
      weeklyCompleted,
      ordersInProgress,
      overdueTasks,
      taskCompletionTime,
      employeePerformance
    ] = await Promise.all([
      // Tâches du jour
      prisma.task.findMany({
        where: {
          OR: [
            { startTime: { gte: new Date().setHours(0, 0, 0, 0) } },
            { endTime: { gte: new Date().setHours(0, 0, 0, 0) } }
          ]
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              priority: true
            }
          },
          assignedTo: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          order: { priority: 'desc' }
        }
      }),
      
      // Tâches terminées cette semaine
      prisma.task.groupBy({
        by: ['type'],
        _count: true,
        where: {
          status: 'COMPLETED',
          endTime: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Commandes en cours
      prisma.order.count({
        where: { status: 'IN_PROGRESS' }
      }),
      
      // Tâches en retard
      prisma.task.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          order: {
            deadline: { lt: new Date() }
          }
        }
      }),
      
      // Temps moyen de complétion par type
      prisma.task.groupBy({
        by: ['type'],
        _avg: {
          actualHours: true
        },
        where: {
          status: 'COMPLETED',
          actualHours: { not: null },
          endTime: { gte: thirtyDaysAgo }
        }
      }),
      
      // Performance par employé
      prisma.user.findMany({
        where: {
          role: { in: ['EMPLOYEE', 'PRODUCTION_MANAGER', 'USER'] },
          assignedTasks: {
            some: {
              status: 'COMPLETED',
              endTime: { gte: thirtyDaysAgo }
            }
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          assignedTasks: {
            where: {
              status: 'COMPLETED',
              endTime: { gte: thirtyDaysAgo }
            }
          }
        }
      })
    ]);

    // Formater les performances des employés
    const formattedEmployeePerformance = employeePerformance.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      completedTasks: emp.assignedTasks.length
    }));

    res.json({
      success: true,
      data: {
        todayTasks,
        weeklyCompleted,
        ordersInProgress,
        overdueTasks,
        taskCompletionTime,
        employeePerformance: formattedEmployeePerformance,
        summary: {
          totalTasksToday: todayTasks.length,
          completedThisWeek: weeklyCompleted.reduce((sum, item) => sum + item._count, 0),
          urgentOrders: ordersInProgress,
          delayedTasks: overdueTasks
        }
      }
    });

  } catch (error) {
    console.error('Get production dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord'
    });
  }
});

module.exports = router;
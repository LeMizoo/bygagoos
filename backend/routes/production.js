const express = require('express');
const router = express.Router();

// Route pour obtenir l'equipe de production
router.get('/team', (req, res) => {
  console.log('GET /api/production/team');

  try {
    const team = [
      { id: 1, name: 'Miarantsoa', role: 'Responsable Production', status: 'Actif', avatar: 'M' },
      { id: 2, name: 'Tia Faniry', role: 'Operateur Serigraphie', status: 'Actif', avatar: 'T' },
      { id: 3, name: 'Volatiana', role: 'Controle Qualite', status: 'Actif', avatar: 'V' },
      { id: 4, name: 'Tovoniaina', role: 'Technicien Machines', status: 'Actif', avatar: 'T' },
      { id: 5, name: 'Mbin', role: 'Assistant Production', status: 'En conge', avatar: 'M' },
    ];
    res.json({
      success: true,
      data: team,
      message: 'Equipe de production recuperee'
    });
  } catch (error) {
    console.error('Erreur dans /team:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route pour obtenir les taches de production
router.get('/tasks', (req, res) => {
  console.log('GET /api/production/tasks');

  try {
    const tasks = [
      {
        id: 1,
        title: 'Impression commande #1001 - T-shirts',
        status: 'En cours',
        priority: 'Haute',
        progress: 75,
        deadline: '2024-01-20',
        assignedTo: 'Tia Faniry'
      },
      {
        id: 2,
        title: 'Preparation commande #1002 - Polos',
        status: 'A faire',
        priority: 'Moyenne',
        progress: 0,
        deadline: '2024-01-22',
        assignedTo: 'Miarantsoa'
      },
      {
        id: 3,
        title: 'Controle qualite #1003 - Sweats',
        status: 'Termine',
        priority: 'Basse',
        progress: 100,
        deadline: '2024-01-18',
        assignedTo: 'Volatiana'
      },
      {
        id: 4,
        title: 'Maintenance machine #4',
        status: 'En cours',
        priority: 'Haute',
        progress: 40,
        deadline: '2024-01-19',
        assignedTo: 'Tovoniaina'
      },
      {
        id: 5,
        title: 'Reception matieres premieres',
        status: 'A faire',
        priority: 'Moyenne',
        progress: 0,
        deadline: '2024-01-21',
        assignedTo: 'Mbin'
      },
    ];
    res.json({
      success: true,
      data: tasks,
      message: 'Taches de production recuperees'
    });
  } catch (error) {
    console.error('Erreur dans /tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route pour obtenir les statistiques de production
router.get('/stats', (req, res) => {
  console.log('GET /api/production/stats');

  try {
    const stats = {
      totalOrders: 42,
      completedOrders: 35,
      pendingOrders: 7,
      productivity: 83,
      efficiency: 92,
      avgCompletionTime: '2.5 jours'
    };
    res.json({
      success: true,
      data: stats,
      message: 'Statistiques de production recuperees'
    });
  } catch (error) {
    console.error('Erreur dans /stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route pour obtenir les machines
router.get('/machines', (req, res) => {
  console.log('GET /api/production/machines');

  try {
    const machines = [
      { id: 1, name: 'Presse Serigraphie #1', status: 'En marche', type: 'Serigraphie', uptime: '95%' },
      { id: 2, name: 'Presse Serigraphie #2', status: 'Maintenance', type: 'Serigraphie', uptime: '85%' },
      { id: 3, name: 'Imprimante Numerique', status: 'En marche', type: 'Numerique', uptime: '98%' },
      { id: 4, name: 'Secheur Tunnel', status: 'En marche', type: 'Sechage', uptime: '92%' },
      { id: 5, name: 'Coupeuse Laser', status: 'En panne', type: 'Decoupe', uptime: '75%' },
    ];
    res.json({
      success: true,
      data: machines,
      message: 'Machines de production recuperees'
    });
  } catch (error) {
    console.error('Erreur dans /machines:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;

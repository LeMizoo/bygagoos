// backend/routes/files.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { validationResult, body, param } = require('express-validator');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Configuration du stockage Multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    try {
      // Créer les dossiers s'ils n'existent pas
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Sous-dossier par type de fichier
      let subDir = 'general';
      if (req.params.orderId) {
        subDir = `orders/${req.params.orderId}`;
      }
      
      const finalDir = path.join(uploadDir, subDir);
      await fs.mkdir(finalDir, { recursive: true });
      
      cb(null, finalDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip', 'application/x-rar-compressed',
    'application/illustrator', 'image/vnd.adobe.photoshop',
    'application/postscript', 'image/svg+xml'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // Max 10 fichiers par requête
  }
});

// GET /api/files/order/:orderId - Récupérer les fichiers d'une commande
router.get('/order/:orderId', auth, [
  param('orderId').isInt().withMessage('ID de commande invalide')
], async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier les permissions
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      const userOrder = await prisma.order.findFirst({
        where: {
          id: orderId,
          OR: [
            { createdById: req.user.id },
            { assignedToId: req.user.id }
          ]
        }
      });

      if (!userOrder) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès aux fichiers de cette commande'
        });
      }
    }

    const files = await prisma.orderFile.findMany({
      where: { orderId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Grouper par type de fichier
    const groupedFiles = files.reduce((acc, file) => {
      if (!acc[file.fileType]) {
        acc[file.fileType] = [];
      }
      acc[file.fileType].push(file);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        files,
        grouped: groupedFiles,
        total: files.length,
        byType: Object.keys(groupedFiles).reduce((acc, type) => {
          acc[type] = groupedFiles[type].length;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get order files error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fichiers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/files/order/:orderId/upload - Télécharger des fichiers pour une commande
router.post('/order/:orderId/upload', auth, [
  param('orderId').isInt().withMessage('ID de commande invalide')
], upload.array('files', 10), async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true }
    });

    if (!order) {
      // Supprimer les fichiers uploadés si la commande n'existe pas
      if (req.files && req.files.length > 0) {
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
      }

      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier les permissions
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      const userOrder = await prisma.order.findFirst({
        where: {
          id: orderId,
          OR: [
            { createdById: req.user.id },
            { assignedToId: req.user.id }
          ]
        }
      });

      if (!userOrder) {
        // Supprimer les fichiers uploadés
        if (req.files && req.files.length > 0) {
          await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
        }

        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de télécharger des fichiers pour cette commande'
        });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier téléchargé'
      });
    }

    const { fileType = 'OTHER', notes } = req.body;

    // Valider le type de fichier
    const validFileTypes = ['DESIGN', 'INVOICE', 'QUOTE', 'CONTRACT', 'DELIVERY_NOTE', 'OTHER'];
    if (!validFileTypes.includes(fileType)) {
      // Supprimer les fichiers uploadés
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));

      return res.status(400).json({
        success: false,
        message: 'Type de fichier invalide'
      });
    }

    const uploadedFiles = [];

    // Enregistrer chaque fichier dans la base de données
    for (const file of req.files) {
      const relativePath = file.path.replace(/.*\/uploads\//, '/uploads/');
      
      const dbFile = await prisma.orderFile.create({
        data: {
          orderId,
          filename: file.filename,
          originalName: file.originalname,
          fileType,
          path: relativePath,
          size: file.size,
          uploadedById: req.user.id,
          notes
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      uploadedFiles.push(dbFile);
    }

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'FILES_UPLOADED',
        entityType: 'Order',
        entityId: orderId,
        details: {
          orderNumber: order.orderNumber,
          fileCount: uploadedFiles.length,
          fileTypes: [...new Set(uploadedFiles.map(f => f.fileType))],
          totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} fichier(s) téléchargé(s) avec succès`,
      data: uploadedFiles
    });
  } catch (error) {
    // Nettoyer les fichiers en cas d'erreur
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
    }

    console.error('Upload files error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement des fichiers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/:id - Récupérer les détails d'un fichier
router.get('/:id', auth, [
  param('id').isInt().withMessage('ID de fichier invalide')
], async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    const file = await prisma.orderFile.findUnique({
      where: { id: fileId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier les permissions
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      const userOrder = await prisma.order.findFirst({
        where: {
          id: file.orderId,
          OR: [
            { createdById: req.user.id },
            { assignedToId: req.user.id }
          ]
        }
      });

      if (!userOrder) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à ce fichier'
        });
      }
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du fichier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/:id/download - Télécharger un fichier
router.get('/:id/download', auth, [
  param('id').isInt().withMessage('ID de fichier invalide')
], async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    const file = await prisma.orderFile.findUnique({
      where: { id: fileId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier les permissions
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      const userOrder = await prisma.order.findFirst({
        where: {
          id: file.orderId,
          OR: [
            { createdById: req.user.id },
            { assignedToId: req.user.id }
          ]
        }
      });

      if (!userOrder) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à ce fichier'
        });
      }
    }

    const filePath = path.join(__dirname, '../..', file.path);

    try {
      await fs.access(filePath);
      
      // Définir les en-têtes de téléchargement
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', file.size);
      
      // Envoyer le fichier
      res.sendFile(filePath);
    } catch (error) {
      console.error('File not found on disk:', filePath);
      return res.status(404).json({
        success: false,
        message: 'Fichier introuvable sur le serveur'
      });
    }
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du fichier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/files/:id - Mettre à jour les métadonnées d'un fichier
router.put('/:id', auth, [
  param('id').isInt().withMessage('ID de fichier invalide'),
  body('fileType').optional().isIn(['DESIGN', 'INVOICE', 'QUOTE', 'CONTRACT', 'DELIVERY_NOTE', 'OTHER']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    // Valider les données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const fileId = parseInt(req.params.id);
    const { fileType, notes } = req.body;

    // Vérifier que le fichier existe
    const existingFile = await prisma.orderFile.findUnique({
      where: { id: fileId },
      include: {
        order: {
          select: { id: true }
        }
      }
    });

    if (!existingFile) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier les permissions
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      if (existingFile.uploadedById !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de modifier ce fichier'
        });
      }
    }

    const updateData = {};
    if (fileType) updateData.fileType = fileType;
    if (notes !== undefined) updateData.notes = notes;

    const file = await prisma.orderFile.update({
      where: { id: fileId },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'FILE_UPDATED',
        entityType: 'OrderFile',
        entityId: fileId,
        details: {
          orderId: file.orderId,
          orderNumber: file.order.orderNumber,
          updatedFields: Object.keys(updateData),
          filename: file.filename
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Fichier mis à jour avec succès',
      data: file
    });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du fichier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/files/:id - Supprimer un fichier
router.delete('/:id', auth, [
  param('id').isInt().withMessage('ID de fichier invalide')
], async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    // Vérifier que le fichier existe
    const file = await prisma.orderFile.findUnique({
      where: { id: fileId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier les permissions
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      // Seul l'uploader ou un manager peut supprimer
      const canDelete = file.uploadedById === req.user.id || 
                       ['MANAGER'].includes(req.user.role);
      
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de supprimer ce fichier'
        });
      }
    }

    const filePath = path.join(__dirname, '../..', file.path);

    // Supprimer le fichier physique
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Could not delete physical file:', error.message);
      // Continuer quand même avec la suppression de la base de données
    }

    // Supprimer l'entrée de la base de données
    await prisma.orderFile.delete({
      where: { id: fileId }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'FILE_DELETED',
        entityType: 'OrderFile',
        entityId: fileId,
        details: {
          orderId: file.orderId,
          orderNumber: file.order.orderNumber,
          filename: file.filename,
          originalName: file.originalName,
          fileType: file.fileType
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fichier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/stats - Statistiques des fichiers
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalFiles,
      totalSize,
      filesByType,
      recentUploads,
      topUploaders,
      monthlyStats
    ] = await Promise.all([
      // Total fichiers
      prisma.orderFile.count(),
      
      // Taille totale
      prisma.orderFile.aggregate({
        _sum: { size: true }
      }),
      
      // Répartition par type
      prisma.orderFile.groupBy({
        by: ['fileType'],
        _count: true,
        _sum: { size: true }
      }),
      
      // Uploads récents
      prisma.orderFile.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      
      // Top uploaders
      prisma.orderFile.groupBy({
        by: ['uploadedById'],
        where: {
          createdAt: { gte: startOfMonth }
        },
        _count: true,
        _sum: { size: true },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      }),
      
      // Statistiques mensuelles
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as fileCount,
          SUM(size) as dailySize
        FROM order_files
        WHERE createdAt >= DATE('now', '-30 days')
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `
    ]);

    // Enrichir les top uploaders
    const enrichedTopUploaders = await Promise.all(
      topUploaders.map(async (uploader) => {
        const user = await prisma.user.findUnique({
          where: { id: uploader.uploadedById },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        });
        
        return {
          user,
          fileCount: uploader._count,
          totalSize: uploader._sum.size || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        totals: {
          files: totalFiles,
          size: totalSize._sum.size || 0,
          formattedSize: formatFileSize(totalSize._sum.size || 0)
        },
        byType: filesByType.reduce((acc, item) => {
          acc[item.fileType] = {
            count: item._count,
            size: item._sum.size || 0,
            formattedSize: formatFileSize(item._sum.size || 0)
          };
          return acc;
        }, {}),
        recentUploads: recentUploads.map(file => ({
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          fileType: file.fileType,
          size: file.size,
          formattedSize: formatFileSize(file.size),
          order: file.order,
          uploadedBy: file.uploadedBy,
          createdAt: file.createdAt
        })),
        topUploaders: enrichedTopUploaders,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('File stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques des fichiers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
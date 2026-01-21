const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Creer le dossier uploads s'il n'existe pas
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Dossier upload cree: ${uploadDir}`);
}

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type || 'general';
    const uploadPath = path.join(uploadDir, type);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
  const allowedDocTypes = (process.env.ALLOWED_DOC_TYPES || 'application/pdf').split(',');

  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorise'), false);
  }
};

// Configuration multer principale
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5
  }
});

/**
 * Middleware pour l'upload d'images avec optimisation
 */
const uploadImage = (fieldName = 'image', maxCount = 1) => {
  return (req, res, next) => {
    const uploadMiddleware = maxCount > 1
      ? upload.array(fieldName, maxCount)
      : upload.single(fieldName);

    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: `Erreur d'upload: ${err.message}`,
          code: 'UPLOAD_ERROR'
        });
      }

      // Si aucun fichier n'a ete uploade
      if (!req.file && !req.files) {
        return next();
      }

      try {
        // Optimiser les images si ce sont des images
        const files = req.file ? [req.file] : req.files;

        for (const file of files) {
          if (file.mimetype.startsWith('image/')) {
            await optimizeImage(file);
          }

          // Ajouter des metadonnees au fichier
          file.metadata = {
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date().toISOString(),
            url: `/uploads/${req.params.type || 'general'}/${file.filename}`
          };
        }

        next();
      } catch (error) {
        console.error('Erreur optimisation image:', error);
        next();
      }
    });
  };
};

/**
 * Middleware pour l'upload de documents
 */
const uploadDocument = (fieldName = 'document') => {
  return upload.single(fieldName);
};

/**
 * Middleware pour l'upload multiple
 */
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Optimiser une image avec Sharp
 */
async function optimizeImage(file) {
  const filePath = file.path;
  const optimizedPath = filePath.replace(/(\.[\w\d_-]+)$/i, '_optimized$1');

  try {
    await sharp(filePath)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .png({
        quality: 85,
        progressive: true,
        compressionLevel: 9
      })
      .webp({
        quality: 85
      })
      .toFile(optimizedPath);

    // Remplacer l'original par l'optimise
    fs.unlinkSync(filePath);
    fs.renameSync(optimizedPath, filePath);

    // Mettre a jour la taille du fichier
    const stats = fs.statSync(filePath);
    file.size = stats.size;

    console.log(`✅ Image optimisee: ${file.originalname} -> ${(stats.size / 1024).toFixed(2)}KB`);
  } catch (error) {
    console.warn(`⚠️ Impossible d'optimiser l'image ${file.originalname}:`, error.message);
  }
}

/**
 * Generer des thumbnails pour les images
 */
async function generateThumbnail(file, width = 300, height = 300) {
  const filePath = file.path;
  const ext = path.extname(filePath);
  const thumbPath = filePath.replace(ext, `_thumb${ext}`);

  try {
    await sharp(filePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbPath);

    return {
      thumbnail: thumbPath,
      thumbnailUrl: file.metadata.url.replace(ext, `_thumb${ext}`)
    };
  } catch (error) {
    console.warn(`⚠️ Impossible de generer le thumbnail:`, error.message);
    return null;
  }
}

/**
 * Supprimer un fichier uploade
 */
function deleteUploadedFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);

      // Essayer de supprimer le thumbnail aussi
      const thumbPath = filePath.replace(/(\.[\w\d_-]+)$/i, '_thumb$1');
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }

      // Essayer de supprimer la version optimisee
      const optimizedPath = filePath.replace(/(\.[\w\d_-]+)$/i, '_optimized$1');
      if (fs.existsSync(optimizedPath)) {
        fs.unlinkSync(optimizedPath);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur suppression fichier:', error);
      return false;
    }
  }
  return false;
}

/**
 * Nettoyer les fichiers temporaires
 */
function cleanupOldFiles(days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        scanDirectory(itemPath);
      } else if (stats.isFile() && stats.mtime < cutoffDate) {
        // Supprimer les fichiers anciens
        fs.unlinkSync(itemPath);
        console.log(`🗑️ Fichier nettoye: ${itemPath}`);
      }
    });
  }

  scanDirectory(uploadDir);
}

// Nettoyer periodiquement les anciens fichiers
if (process.env.NODE_ENV === 'production') {
  setInterval(() => cleanupOldFiles(7), 24 * 60 * 60 * 1000); // Tous les jours
}

module.exports = {
  upload,
  uploadImage,
  uploadDocument,
  uploadMultiple,
  generateThumbnail,
  deleteUploadedFile,
  cleanupOldFiles
};

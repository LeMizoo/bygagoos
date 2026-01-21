// backend/controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const authController = {
  // ---------------------------
  // LOGIN
  // ---------------------------
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log(`🔐 Tentative de connexion: ${email}`);

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis',
        });
      }

      // Trouver l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.warn(`❌ Utilisateur non trouvé: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
      }

      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.warn(`❌ Mot de passe incorrect pour: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
      }

      // Générer token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '7d' }
      );

      console.log(`✅ Connexion réussie: ${email}, rôle: ${user.role}`);

      return res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message,
      });
    }
  },

  // ---------------------------
  // REGISTER
  // ---------------------------
  register: async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis',
        });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email déjà utilisé',
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'user',
        },
      });

      // Générer token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message,
      });
    }
  },

  // ---------------------------
  // GET PROFILE (/me)
  // ---------------------------
  getProfile: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token manquant',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable',
        });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('❌ Erreur profil:', error);
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }
  },

  // ---------------------------
  // VERIFY TOKEN
  // ---------------------------
  verifyToken: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token manquant',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

      return res.json({
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
        message: 'Token valide',
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
      });
    }
  },
};

export default authController;

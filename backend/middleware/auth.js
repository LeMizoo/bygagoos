const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        familyId: true,
        profileImage: true
      }
    });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Veuillez vous authentifier'
    });
  }
};

module.exports = auth;
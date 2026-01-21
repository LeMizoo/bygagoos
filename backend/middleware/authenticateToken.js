// backend/middleware/authenticateToken.js
import jwt from 'jsonwebtoken';

export default function authenticateToken(req, res, nextFunc) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    nextFunc();
  });
}

import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    res.status(200).json({
      success: true,
      user: { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role },
      message: 'Token valide'
    });
  } catch {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
}

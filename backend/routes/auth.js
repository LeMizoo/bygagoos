// backend/routes/auth.js - Version corrigée
router.post('/login', async (req, res) => {
  try {
    // Accepter soit username, soit email
    const { username, email, password } = req.body;
    
    // Utiliser email si username n'est pas fourni
    const identifier = username || email;
    
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Identifiant et mot de passe sont requis' 
      });
    }
    
    // Simulation de vérification (à remplacer par votre logique de base de données)
    const validCredentials = [
      { identifier: 'admin@bygagoos.com', password: 'demo123', role: 'admin' },
      { identifier: 'manager@bygagoos.com', password: 'demo123', role: 'manager' },
      { identifier: 'user@bygagoos.com', password: 'demo123', role: 'user' }
    ];
    
    const foundUser = validCredentials.find(
      cred => cred.identifier === identifier && cred.password === password
    );
    
    if (foundUser) {
      const user = {
        id: 1,
        email: identifier,
        username: identifier.split('@')[0],
        name: identifier.split('@')[0],
        role: foundUser.role,
        avatar: null
      };
      
      // Générer un token JWT (en production, utilisez une bibliothèque comme jsonwebtoken)
      const token = 'jwt-token-' + Date.now();
      
      return res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Identifiants incorrects'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});
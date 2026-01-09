const nodemailer = require('nodemailer');
const logger = require('./logger');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.templates = {};
    
    this.init();
    this.loadTemplates();
  }

  async init() {
    try {
      // Configuration pour Gmail (à adapter selon le fournisseur)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Vérifier la connexion
      await this.transporter.verify();
      this.initialized = true;
      logger.info('✅ Service email initialisé avec succès');
    } catch (error) {
      logger.error(`❌ Erreur initialisation email: ${error.message}`);
      this.initialized = false;
    }
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      try {
        await fs.access(templatesDir);
      } catch {
        // Créer le dossier templates s'il n'existe pas
        await fs.mkdir(templatesDir, { recursive: true });
        await this.createDefaultTemplates(templatesDir);
      }
      
      const files = await fs.readdir(templatesDir);
      
      for (const file of files) {
        if (file.endsWith('.html')) {
          const templateName = path.basename(file, '.html');
          const content = await fs.readFile(path.join(templatesDir, file), 'utf8');
          this.templates[templateName] = content;
        }
      }
      
      logger.info(`✅ ${Object.keys(this.templates).length} templates email chargés`);
    } catch (error) {
      logger.error(`❌ Erreur chargement templates: ${error.message}`);
    }
  }

  async createDefaultTemplates(templatesDir) {
    const defaultTemplates = {
      'welcome': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue chez BYGAGOOS INK</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .logo { max-width: 150px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Bienvenue chez BYGAGOOS INK !</h1>
    </div>
    <div class="content">
        <p>Bonjour {{firstName}},</p>
        
        <p>Nous sommes ravis de vous accueillir sur notre plateforme de gestion de sérigraphie.</p>
        
        <p>Votre compte a été créé avec succès avec le rôle: <strong>{{role}}</strong></p>
        
        <p>Vous pouvez maintenant :</p>
        <ul>
            <li>Suivre vos commandes en temps réel</li>
            <li>Consulter votre historique</li>
            <li>Communiquer avec notre équipe</li>
            <li>Gérer votre profil</li>
        </ul>
        
        <p style="text-align: center;">
            <a href="{{loginUrl}}" class="button">Accéder à mon compte</a>
        </p>
        
        <p>Identifiants de connexion :</p>
        <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
            <p><strong>Email :</strong> {{email}}</p>
            <p><strong>Mot de passe temporaire :</strong> {{password}}</p>
            <p><small>Nous vous recommandons de changer votre mot de passe après votre première connexion.</small></p>
        </div>
        
        <p>Besoin d'aide ? Contactez-nous :</p>
        <p>📞 +261 34 43 593 30<br>
           📧 support@bygagoos-ink.mg</p>
    </div>
    <div class="footer">
        <p>BYGAGOOS INK - Entreprise Familiale de Sérigraphie<br>
        Lot IPA 165, Anosimasina, Antananarivo 102, Madagascar</p>
        <p>© 2025 BYGAGOOS INK. Tous droits réservés.</p>
    </div>
</body>
</html>
      `,

      'order-confirmation': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande #{{orderNumber}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; margin: 15px 0; }
        .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .status-badge { display: inline-block; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
        .status-pending { background: #ffeb3b; color: #333; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Confirmation de commande</h2>
    </div>
    <div class="content">
        <p>Bonjour {{clientName}},</p>
        
        <p>Votre commande <strong>#{{orderNumber}}</strong> a été enregistrée avec succès.</p>
        
        <div class="order-details">
            <h3>Détails de la commande</h3>
            <p><strong>Numéro :</strong> {{orderNumber}}</p>
            <p><strong>Date :</strong> {{orderDate}}</p>
            <p><strong>Montant total :</strong> {{totalAmount}} MGA</p>
            <p><strong>Acompte :</strong> {{deposit}} MGA</p>
            <p><strong>Solde :</strong> {{balance}} MGA</p>
            <p><strong>Date de livraison prévue :</strong> {{deliveryDate}}</p>
            <p><strong>Statut :</strong> <span class="status-badge status-pending">En attente</span></p>
        </div>
        
        <p>Vous pouvez suivre l'avancement de votre commande à tout moment en vous connectant à votre espace client.</p>
        
        <p>Cordialement,<br>
        L'équipe BYGAGOOS INK</p>
    </div>
    <div class="footer">
        <p>BYGAGOOS INK - Sérigraphie de qualité<br>
        Contact : +261 34 43 593 30 | positifaid@live.fr</p>
    </div>
</body>
</html>
      `,

      'order-status-update': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mise à jour commande #{{orderNumber}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status-update { background: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 15px 0; }
        .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Mise à jour de votre commande</h2>
    </div>
    <div class="content">
        <p>Bonjour {{clientName}},</p>
        
        <p>Le statut de votre commande <strong>#{{orderNumber}}</strong> a été mis à jour.</p>
        
        <div class="status-update">
            <h3>Nouveau statut : {{newStatus}}</h3>
            <p><strong>Ancien statut :</strong> {{oldStatus}}</p>
            <p><strong>Date de mise à jour :</strong> {{updateDate}}</p>
            {{#if notes}}
            <p><strong>Notes :</strong> {{notes}}</p>
            {{/if}}
        </div>
        
        <p>Vous pouvez suivre l'avancement de votre commande à tout moment en vous connectant à votre espace client.</p>
        
        <p>Cordialement,<br>
        L'équipe BYGAGOOS INK</p>
    </div>
    <div class="footer">
        <p>BYGAGOOS INK - Votre partenaire en sérigraphie</p>
    </div>
</body>
</html>
      `,

      'password-reset': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .reset-box { background: white; padding: 20px; border-radius: 5px; border: 1px solid #ddd; text-align: center; margin: 20px 0; }
        .reset-button { display: inline-block; padding: 12px 30px; background: #FF5722; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Réinitialisation de mot de passe</h2>
    </div>
    <div class="content">
        <p>Bonjour {{firstName}},</p>
        
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        
        <div class="reset-box">
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <a href="{{resetUrl}}" class="reset-button">Créer un nouveau mot de passe</a>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">
                Ce lien expirera dans 1 heure.<br>
                Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
            </p>
        </div>
        
        <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #2196F3;">{{resetUrl}}</p>
        
        <p>Cordialement,<br>
        L'équipe BYGAGOOS INK</p>
    </div>
    <div class="footer">
        <p>© 2025 BYGAGOOS INK. Tous droits réservés.</p>
    </div>
</body>
</html>
      `
    };

    for (const [name, content] of Object.entries(defaultTemplates)) {
      await fs.writeFile(
        path.join(templatesDir, `${name}.html`),
        content.trim(),
        'utf8'
      );
    }
  }

  // Remplacer les variables dans un template
  replaceTemplateVariables(template, variables) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    return result;
  }

  // Envoyer un email
  async sendEmail(to, subject, templateName, variables = {}) {
    if (!this.initialized) {
      logger.warn('Service email non initialisé. Email non envoyé.');
      return false;
    }

    try {
      // Récupérer le template
      let html;
      if (this.templates[templateName]) {
        html = this.replaceTemplateVariables(this.templates[templateName], variables);
      } else {
        // Template par défaut si non trouvé
        html = `
          <h2>${subject}</h2>
          <p>${JSON.stringify(variables, null, 2)}</p>
        `;
      }

      // Options de l'email
      const mailOptions = {
        from: `"BYGAGOOS INK" <${process.env.EMAIL_FROM || 'noreply@bygagoos-ink.mg'}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        text: this.htmlToText(html)
      };

      // Envoyer l'email
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`📧 Email envoyé à ${to} - Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Erreur envoi email: ${error.message}`);
      return false;
    }
  }

  // Convertir HTML en texte simple
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Méthodes spécifiques
  async sendWelcomeEmail(user, temporaryPassword) {
    return this.sendEmail(
      user.email,
      'Bienvenue chez BYGAGOOS INK !',
      'welcome',
      {
        firstName: user.firstName,
        email: user.email,
        password: temporaryPassword,
        role: user.role,
        loginUrl: `${process.env.FRONTEND_URL || 'https://bygagoos-ink.vercel.app'}/login`
      }
    );
  }

  async sendOrderConfirmation(order, client) {
    return this.sendEmail(
      client.email,
      `Confirmation de commande #${order.orderNumber}`,
      'order-confirmation',
      {
        clientName: client.contactName,
        orderNumber: order.orderNumber,
        orderDate: new Date(order.orderDate).toLocaleDateString('fr-MG'),
        totalAmount: this.formatAriary(order.totalAmount),
        deposit: this.formatAriary(order.deposit),
        balance: this.formatAriary(order.balance),
        deliveryDate: order.deliveryDate ? 
          new Date(order.deliveryDate).toLocaleDateString('fr-MG') : 
          'À confirmer'
      }
    );
  }

  async sendOrderStatusUpdate(order, client, oldStatus, newStatus) {
    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      in_production: 'En production',
      ready: 'Prête',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };

    return this.sendEmail(
      client.email,
      `Mise à jour commande #${order.orderNumber}`,
      'order-status-update',
      {
        clientName: client.contactName,
        orderNumber: order.orderNumber,
        oldStatus: statusLabels[oldStatus] || oldStatus,
        newStatus: statusLabels[newStatus] || newStatus,
        updateDate: new Date().toLocaleDateString('fr-MG'),
        notes: order.notes || ''
      }
    );
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://bygagoos-ink.vercel.app'}/reset-password?token=${resetToken}`;
    
    return this.sendEmail(
      user.email,
      'Réinitialisation de votre mot de passe',
      'password-reset',
      {
        firstName: user.firstName,
        resetUrl: resetUrl
      }
    );
  }

  async sendLowStockAlert(consumable, responsibleEmails) {
    return this.sendEmail(
      responsibleEmails,
      `Alerte stock faible : ${consumable.name}`,
      'custom',
      {
        subject: 'Alerte Stock',
        message: `Le stock de "${consumable.name}" est faible : ${consumable.quantity} ${consumable.unit} restant(s) (Minimum: ${consumable.minLevel}).`
      }
    );
  }

  // Formater l'Ariary
  formatAriary(amount) {
    return new Intl.NumberFormat('mg-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Tester la connexion SMTP
  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Connexion SMTP réussie' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Obtenir les statistiques d'envoi
  async getStats() {
    if (!this.transporter) {
      return { sent: 0, failed: 0 };
    }
    
    // Implémenter la logique de suivi des emails envoyés
    // (nécessite une base de données pour le suivi)
    return { sent: 0, failed: 0 };
  }
}

// Exporter une instance singleton
const emailService = new EmailService();
module.exports = emailService;
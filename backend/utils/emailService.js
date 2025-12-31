const nodemailer = require('nodemailer');
const logger = require('./logger');

const emailService = {
  transporter: null,
  
  initialize() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });
    logger.info('Email service initialized');
  },
  
  async sendEmail(to, subject, html, attachments = []) {
    if (!this.transporter) {
      this.initialize();
    }
    
    try {
      const info = await this.transporter.sendMail({
        from: `"ByGagoos Ink" <${process.env.SMTP_FROM || 'noreply@bygagoos.com'}>`,
        to,
        subject,
        html,
        attachments,
      });
      
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  },
  
  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue chez ByGagoos Ink !</h2>
        <p>Bonjour ${user.name},</p>
        <p>Votre compte a été créé avec succès.</p>
        <p>Vous pouvez maintenant accéder au système de gestion de l'entreprise familiale.</p>
        <p>Voici vos informations :</p>
        <ul>
          <li>Email: ${user.email}</li>
          <li>Rôle: ${user.role}</li>
        </ul>
        <p>Merci de nous rejoindre !</p>
        <p>L'équipe ByGagoos Ink</p>
      </div>
    `;
    
    return this.sendEmail(user.email, 'Bienvenue chez ByGagoos Ink', html);
  }
};

module.exports = emailService;

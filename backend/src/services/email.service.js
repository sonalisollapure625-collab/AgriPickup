import nodemailer from 'nodemailer';
import { config } from '../config/environment.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (config.email.smtpHost && config.email.smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpSecure,
        auth: {
          user: config.email.smtpUser,
          pass: config.email.smtpPass,
        },
      });
    }
  }

  /**
   * Send Password Reset Email
   * If SMTP is not configured, logs reset instructions securely for development testing
   */
  async sendPasswordResetEmail({ toEmail, name, resetUrl }) {
    const subject = 'AgriPickup - Reset Your Account Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #059669; margin: 0;">🌾 AgriPickup</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Fresh Farm Needs, Just a Pickup Away!</p>
        </div>
        <div style="color: #1e293b; font-size: 15px; line-height: 1.6;">
          <p>Hello <strong>${name || 'there'}</strong>,</p>
          <p>We received a request to reset your password for your AgriPickup account (${toEmail}).</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            This link is valid for <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8;">
            Link not clickable? Copy and paste this URL into your browser:<br />
            <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `;

    if (this.transporter) {
      return await this.transporter.sendMail({
        from: config.email.from,
        to: toEmail,
        subject,
        html,
      });
    } else {
      // In development when SMTP is not configured, record delivery simulation notice
      console.log(`[EmailService] SMTP not configured. Password reset link for ${toEmail}: ${resetUrl}`);
      return { simulated: true, toEmail };
    }
  }
}

export const emailService = new EmailService();

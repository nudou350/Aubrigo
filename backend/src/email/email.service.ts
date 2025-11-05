import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@petsos.com');

    // Create transporter
    const emailHost = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
    const emailPort = this.configService.get<number>('EMAIL_PORT', 587);
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');

    if (!emailUser || !emailPassword) {
      this.logger.warn('Email credentials not configured. Email sending will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    this.logger.log('Email service initialized');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (no transporter): ${options.subject}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      this.logger.log(`Email sent successfully to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">Bem-vindo ao Pet SOS!</h1>
        <p>Olá <strong>${name}</strong>,</p>
        <p>Obrigado por se registrar no Pet SOS! Estamos felizes em tê-lo conosco.</p>
        <p>Nossa missão é conectar animais abandonados com famílias amorosas. Juntos, podemos fazer a diferença!</p>
        <p>Comece agora:</p>
        <ul>
          <li>Navegue pelos pets disponíveis</li>
          <li>Adicione seus favoritos</li>
          <li>Agende visitas</li>
          <li>Faça doações para ONGs</li>
        </ul>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Bem-vindo ao Pet SOS!',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, resetUrl: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">Redefinir Senha - Pet SOS</h1>
        <p>Olá,</p>
        <p>Você solicitou a redefinição de senha da sua conta Pet SOS.</p>
        <p>Clique no botão abaixo para redefinir sua senha:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #4ca8a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Redefinir Senha
          </a>
        </p>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>Este link expira em 1 hora.</strong></p>
        <p>Se você não solicitou a redefinição de senha, ignore este email.</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Redefinir Senha - Pet SOS',
      html,
    });
  }

  async sendAppointmentConfirmationToVisitor(
    visitorEmail: string,
    visitorName: string,
    petName: string,
    ongName: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">Confirmação de Visita - Pet SOS</h1>
        <p>Olá <strong>${visitorName}</strong>,</p>
        <p>Sua solicitação de visita foi recebida com sucesso!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c2c2c;">Detalhes da Visita:</h3>
          <p><strong>Pet:</strong> ${petName}</p>
          <p><strong>ONG:</strong> ${ongName}</p>
          <p><strong>Data:</strong> ${date}</p>
          <p><strong>Horário:</strong> ${time}</p>
        </div>
        <p>A ONG entrará em contato em breve para confirmar sua visita.</p>
        <p>Prepare-se para conhecer seu novo amigo!</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: visitorEmail,
      subject: `Confirmação de Visita - ${petName}`,
      html,
    });
  }

  async sendAppointmentNotificationToOng(
    ongEmail: string,
    ongName: string,
    visitorName: string,
    visitorEmail: string,
    visitorPhone: string,
    petName: string,
    date: string,
    time: string,
    notes?: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">Nova Solicitação de Visita - Pet SOS</h1>
        <p>Olá <strong>${ongName}</strong>,</p>
        <p>Você recebeu uma nova solicitação de visita!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c2c2c;">Informações do Visitante:</h3>
          <p><strong>Nome:</strong> ${visitorName}</p>
          <p><strong>Email:</strong> ${visitorEmail}</p>
          <p><strong>Telefone:</strong> ${visitorPhone}</p>
          <h3 style="color: #2c2c2c;">Detalhes da Visita:</h3>
          <p><strong>Pet:</strong> ${petName}</p>
          <p><strong>Data Preferencial:</strong> ${date}</p>
          <p><strong>Horário Preferencial:</strong> ${time}</p>
          ${notes ? `<p><strong>Observações:</strong> ${notes}</p>` : ''}
        </div>
        <p>Entre em contato com o visitante para confirmar a visita.</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: ongEmail,
      subject: `Nova Solicitação de Visita - ${petName}`,
      html,
    });
  }

  async sendDonationReceipt(
    donorEmail: string,
    donorName: string,
    ongName: string,
    amount: number,
    donationType: string,
    transactionId: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">Recibo de Doação - Pet SOS</h1>
        <p>Olá <strong>${donorName}</strong>,</p>
        <p>Obrigado pela sua generosa doação!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c2c2c;">Detalhes da Doação:</h3>
          <p><strong>ONG Beneficiada:</strong> ${ongName}</p>
          <p><strong>Valor:</strong> €${amount.toFixed(2)}</p>
          <p><strong>Tipo:</strong> ${donationType === 'one_time' ? 'Única' : 'Mensal'}</p>
          <p><strong>ID da Transação:</strong> ${transactionId}</p>
        </div>
        <p>Sua contribuição ajuda a salvar vidas e proporcionar um lar amoroso para animais abandonados.</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: donorEmail,
      subject: 'Recibo de Doação - Pet SOS',
      html,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

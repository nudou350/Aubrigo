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
  private readonly adminEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'noreply@petsos.com');
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@petsos.com');

    // Get first URL from FRONTEND_URL (it might be a comma-separated list)
    const frontendUrls = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    this.frontendUrl = frontendUrls.split(',')[0].trim();

    // Create transporter (using SMTP_* env variables for Gmail)
    const emailHost = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const emailPort = this.configService.get<number>('SMTP_PORT', 587);
    const emailUser = this.configService.get<string>('SMTP_USER');
    const emailPassword = this.configService.get<string>('SMTP_PASS');

    if (!emailUser || !emailPassword) {
      this.logger.warn('Email credentials not configured. Email sending will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
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

  async sendOngRegistrationNotificationToAdmin(
    ongName: string,
    ongEmail: string,
    phone: string,
    location: string,
    instagramHandle?: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">Nova ONG Registrada - Pet SOS</h1>
        <p>Olá Administrador,</p>
        <p>Uma nova ONG se registrou na plataforma Pet SOS e aguarda aprovação.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c2c2c;">Informações da ONG:</h3>
          <p><strong>Nome da ONG:</strong> ${ongName}</p>
          <p><strong>Email:</strong> ${ongEmail}</p>
          <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
          <p><strong>Localização:</strong> ${location || 'Não informada'}</p>
          ${instagramHandle ? `<p><strong>Instagram:</strong> @${instagramHandle}</p>` : ''}
        </div>
        <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <strong>⚠️ Ação Necessária:</strong> Acesse o painel administrativo para revisar e aprovar esta ONG.
        </p>
        <p>Atenciosamente,<br/>Sistema Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: this.adminEmail,
      subject: `Nova ONG Registrada: ${ongName}`,
      html,
    });
  }

  async sendWelcomeEmailToOng(
    ongEmail: string,
    ongName: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">Bem-vindo ao Pet SOS!</h1>
        <p>Olá <strong>${ongName}</strong>,</p>
        <p>Obrigado por se registrar no Pet SOS! Estamos felizes em tê-los conosco.</p>
        <p>Sua conta foi criada com sucesso e está aguardando aprovação do administrador. Assim que sua conta for aprovada, você poderá:</p>
        <ul style="line-height: 1.8;">
          <li>📝 Adicionar pets para adoção</li>
          <li>📅 Gerenciar agendamentos de visitas</li>
          <li>💰 Receber doações</li>
          <li>📊 Acompanhar estatísticas da sua ONG</li>
        </ul>
        <p style="background: #e7f7f6; padding: 15px; border-left: 4px solid #4ca8a0; margin: 20px 0;">
          <strong>💡 Próximos Passos:</strong> Aguarde a aprovação do seu cadastro. Você receberá um email assim que sua conta for ativada.
        </p>
        <p>Nossa missão é conectar animais abandonados com famílias amorosas. Juntos, podemos fazer a diferença!</p>
        <p>Se tiver alguma dúvida, não hesite em nos contatar.</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: ongEmail,
      subject: 'Bem-vindo ao Pet SOS!',
      html,
    });
  }

  async sendOngApprovalEmail(
    ongEmail: string,
    ongName: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #27ae60;">🎉 Conta Aprovada - Pet SOS</h1>
        <p>Olá <strong>${ongName}</strong>,</p>
        <p>Ótimas notícias! Sua conta foi aprovada pelo nosso time administrativo.</p>
        <p>Você já pode começar a usar todos os recursos da plataforma Pet SOS:</p>
        <ul style="line-height: 1.8;">
          <li>✅ Adicionar pets para adoção</li>
          <li>✅ Gerenciar agendamentos de visitas</li>
          <li>✅ Receber doações</li>
          <li>✅ Acompanhar estatísticas</li>
        </ul>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${this.frontendUrl}/login" style="background: #4ca8a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Acessar Plataforma
          </a>
        </p>
        <p>Juntos vamos ajudar mais animais a encontrarem um lar!</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: ongEmail,
      subject: 'Conta Aprovada - Pet SOS',
      html,
    });
  }

  async sendOngRejectionEmail(
    ongEmail: string,
    ongName: string,
    reason?: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">Atualização sobre sua Conta - Pet SOS</h1>
        <p>Olá <strong>${ongName}</strong>,</p>
        <p>Agradecemos seu interesse em fazer parte da plataforma Pet SOS.</p>
        <p>Infelizmente, não pudemos aprovar seu cadastro neste momento.</p>
        ${reason ? `
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p><strong>Motivo:</strong> ${reason}</p>
          </div>
        ` : ''}
        <p>Se você acredita que houve um erro ou gostaria de mais informações, por favor entre em contato conosco.</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: ongEmail,
      subject: 'Atualização sobre sua Conta - Pet SOS',
      html,
    });
  }

  async sendAppointmentAutoConfirmedToVisitor(
    visitorEmail: string,
    visitorName: string,
    petName: string,
    ongName: string,
    ongPhone: string,
    ongLocation: string,
    scheduledStartTime: Date,
  ): Promise<boolean> {
    const dateStr = scheduledStartTime.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = scheduledStartTime.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #27ae60;">✅ Visita Confirmada - Pet SOS</h1>
        <p>Olá <strong>${visitorName}</strong>,</p>
        <p>Ótimas notícias! Sua visita foi <strong>automaticamente confirmada</strong>!</p>
        <div style="background: #e7f7f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
          <h3 style="margin-top: 0; color: #2c2c2c;">📅 Detalhes da Visita:</h3>
          <p><strong>Pet:</strong> ${petName}</p>
          <p><strong>ONG:</strong> ${ongName}</p>
          <p><strong>Data:</strong> ${dateStr}</p>
          <p><strong>Horário:</strong> ${timeStr}</p>
          <p><strong>Local:</strong> ${ongLocation}</p>
          <p><strong>Contato:</strong> ${ongPhone}</p>
        </div>
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p><strong>⚠️ Importante:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Chegue com 5-10 minutos de antecedência</li>
            <li>Traga um documento de identificação</li>
            <li>Se não puder comparecer, cancele com antecedência</li>
          </ul>
        </div>
        <p>Prepare-se para conhecer ${petName}! 🐾</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: visitorEmail,
      subject: `✅ Visita Confirmada - ${petName}`,
      html,
    });
  }

  async sendAppointmentAutoConfirmedToOng(
    ongEmail: string,
    ongName: string,
    visitorName: string,
    visitorEmail: string,
    visitorPhone: string,
    petName: string,
    scheduledStartTime: Date,
    notes?: string,
  ): Promise<boolean> {
    const dateStr = scheduledStartTime.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = scheduledStartTime.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ca8a0;">📅 Nova Visita Agendada - Pet SOS</h1>
        <p>Olá <strong>${ongName}</strong>,</p>
        <p>Uma nova visita foi <strong>automaticamente confirmada</strong> no sistema!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c2c2c;">👤 Informações do Visitante:</h3>
          <p><strong>Nome:</strong> ${visitorName}</p>
          <p><strong>Email:</strong> <a href="mailto:${visitorEmail}">${visitorEmail}</a></p>
          <p><strong>Telefone:</strong> ${visitorPhone}</p>
          <h3 style="color: #2c2c2c;">📅 Detalhes da Visita:</h3>
          <p><strong>Pet:</strong> ${petName}</p>
          <p><strong>Data:</strong> ${dateStr}</p>
          <p><strong>Horário:</strong> ${timeStr}</p>
          ${notes ? `<p><strong>Observações:</strong> ${notes}</p>` : ''}
        </div>
        <p style="background: #e7f7f6; padding: 15px; border-left: 4px solid #4ca8a0; margin: 20px 0;">
          <strong>💡 Lembrete:</strong> A visita foi confirmada automaticamente pelo sistema de agendamento inteligente. O visitante já recebeu a confirmação por email.
        </p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: ongEmail,
      subject: `📅 Nova Visita Agendada - ${petName}`,
      html,
    });
  }

  async sendAppointmentCancellationToVisitor(
    visitorEmail: string,
    visitorName: string,
    petName: string,
    ongName: string,
    scheduledStartTime: Date,
    reason?: string,
  ): Promise<boolean> {
    const dateStr = scheduledStartTime.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = scheduledStartTime.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ Visita Cancelada - Pet SOS</h1>
        <p>Olá <strong>${visitorName}</strong>,</p>
        <p>Infelizmente, sua visita foi cancelada.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c2c2c;">Detalhes da Visita Cancelada:</h3>
          <p><strong>Pet:</strong> ${petName}</p>
          <p><strong>ONG:</strong> ${ongName}</p>
          <p><strong>Data:</strong> ${dateStr}</p>
          <p><strong>Horário:</strong> ${timeStr}</p>
        </div>
        ${reason ? `
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p><strong>Motivo:</strong> ${reason}</p>
          </div>
        ` : ''}
        <p>Você pode agendar uma nova visita a qualquer momento através da plataforma.</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: visitorEmail,
      subject: `Visita Cancelada - ${petName}`,
      html,
    });
  }

  async sendAppointmentCancellationToOng(
    ongEmail: string,
    ongName: string,
    visitorName: string,
    petName: string,
    scheduledStartTime: Date,
  ): Promise<boolean> {
    const dateStr = scheduledStartTime.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = scheduledStartTime.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ Visita Cancelada - Pet SOS</h1>
        <p>Olá <strong>${ongName}</strong>,</p>
        <p>Uma visita foi cancelada:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c2c2c;">Detalhes:</h3>
          <p><strong>Visitante:</strong> ${visitorName}</p>
          <p><strong>Pet:</strong> ${petName}</p>
          <p><strong>Data:</strong> ${dateStr}</p>
          <p><strong>Horário:</strong> ${timeStr}</p>
        </div>
        <p>O horário está novamente disponível para agendamento.</p>
        <p>Atenciosamente,<br/>Equipe Pet SOS</p>
      </div>
    `;

    return this.sendEmail({
      to: ongEmail,
      subject: `Visita Cancelada - ${petName}`,
      html,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { TranslationHelperService } from '@/common/services/translation-helper.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const handlebars = require('handlebars');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(
    private configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly translation: TranslationHelperService,
  ) {
    this.fromEmail = this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      this.configService.get<string>(
        'FROM_EMAIL',
        '"Student Information System" <noreply@example.com>',
      ),
    );

    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.error('SENDGRID_API_KEY is not defined in environment variables');
    } else {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid service initialized');
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    const msg = {
      to,
      from: this.fromEmail,
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      if (error.response) {
        this.logger.error(error.response.body);
      }
      throw error;
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const templatePath = path.join(__dirname, 'templates', 'confirmation.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template({
      confirmationUrl: verificationUrl,
      code: token,
    });

    const subject = await this.translation.translate('messages.email.verifyEmailSubject');

    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const templatePath = path.join(__dirname, 'templates', 'reset-password.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template({
      resetUrl,
      token,
    });

    const subject = await this.translation.translate('messages.email.resetPasswordSubject');

    return this.sendEmail(to, subject, html);
  }

  async sendApplicationApprovalEmail(
    to: string,
    data: {
      applicantName: string;
      courseName: string;
      batchName: string;
      rollNumber: string;
      batchStartDate: string;
      lmsUrl?: string;
      supportEmail?: string;
    },
  ) {
    const templatePath = path.join(__dirname, 'templates', 'approval-notification.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template({
      ...data,
      supportEmail: data.supportEmail || this.fromEmail,
    });

    const subject = await this.translation.translate('messages.email.applicationApprovedSubject');

    return this.sendEmail(to, subject, html);
  }
}

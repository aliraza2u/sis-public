import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { TranslationHelperService } from '@/common/services/translation-helper.service';
import { I18nInternalServerErrorException } from '@/common/exceptions/i18n.exception';
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

  private async getTemplateContext(lang: string, baseContext: Record<string, any>) {
    const isRtl = lang === 'ar';
    return {
      ...baseContext,
      dir: isRtl ? 'rtl' : 'ltr',
      align: isRtl ? 'right' : 'left',
    };
  }

  private async translateAll(
    lang: string,
    keys: Record<string, string | { key: string; args?: any }>,
  ) {
    const results: Record<string, string> = {};
    for (const [prop, value] of Object.entries(keys)) {
      if (typeof value === 'string') {
        results[prop] = await this.i18n.translate(value, { lang });
      } else {
        results[prop] = await this.i18n.translate(value.key, { lang, args: value.args });
      }
    }
    return results;
  }

  private getTemplate(templateName: string) {
    const templatePath = path.join(__dirname, 'templates', templateName);
    if (!fs.existsSync(templatePath)) {
      this.logger.error(`Template not found at: ${templatePath}`);
      throw new I18nInternalServerErrorException('messages.email.templateNotFound', {
        template: templateName,
      });
    }
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
  }

  async sendPasswordResetEmail(to: string, token: string, lang = 'en') {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const translations = await this.translateAll(lang, {
      subject: 'messages.email.resetPasswordSubject',
      header: 'messages.email.resetPasswordHeader',
      body: 'messages.email.resetPasswordBody',
      buttonText: 'messages.email.resetPasswordButton',
      tokenLabel: 'messages.email.tokenLabel',
      ignoreMessage: 'messages.email.resetIgnore',
    });

    const context = await this.getTemplateContext(lang, {
      ...translations,
      resetUrl,
      token,
    });

    const template = this.getTemplate('reset-password.hbs');

    const html = template(context);

    return this.sendEmail(to, translations.subject, html);
  }

  async sendPasswordSetupEmail(to: string, token: string, lang = 'en') {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const setupUrl = `${frontendUrl}/setup-password?token=${token}`;

    const translations = await this.translateAll(lang, {
      subject: 'messages.email.setupAccountSubject',
      header: 'messages.email.setupHeader',
      body: 'messages.email.setupBody',
      buttonText: 'messages.email.setupButton',
      tokenLabel: 'messages.email.tokenLabel',
      ignoreMessage: 'messages.email.setupIgnore',
    });

    const context = await this.getTemplateContext(lang, {
      ...translations,
      resetUrl: setupUrl,
      token,
    });

    const template = this.getTemplate('reset-password.hbs');

    const html = template(context);

    return this.sendEmail(to, translations.subject, html);
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
    lang = 'en',
  ) {
    const translations = await this.translateAll(lang, {
      subject: 'messages.email.applicationApprovedSubject',
      header: 'messages.email.approvalHeader',
      subHeader: 'messages.email.approvalSubHeader',
      greeting: { key: 'messages.email.greeting', args: { name: data.applicantName } },
      approvalBody: { key: 'messages.email.approvalBody', args: { courseName: data.courseName } },
      detailsHeader: 'messages.email.detailsHeader',
      studentIdLabel: 'messages.email.studentIdLabel',
      courseLabel: 'messages.email.courseLabel',
      batchLabel: 'messages.email.batchLabel',
      startDateLabel: 'messages.email.startDateLabel',
      nextStepsHeader: 'messages.email.nextStepsHeader',
      nextStep1: { key: 'messages.email.nextStep1', args: { rollNumber: data.rollNumber } },
      nextStep2: 'messages.email.nextStep2',
      nextStep3: 'messages.email.nextStep3',
      accessLmsButton: 'messages.email.accessLmsButton',
      seeYouOn: { key: 'messages.email.seeYouOn', args: { batchStartDate: data.batchStartDate } },
      footerAutomated: 'messages.email.footerAutomated',
      footerSupport: {
        key: 'messages.email.footerSupport',
        args: { supportEmail: data.supportEmail || this.fromEmail },
      },
    });

    const context = await this.getTemplateContext(lang, {
      ...translations,
      ...data,
      supportEmail: data.supportEmail || this.fromEmail,
    });

    const template = this.getTemplate('approval-notification.hbs');

    const html = template(context);

    return this.sendEmail(to, translations.subject, html);
  }

  async sendAdminCongratulationsEmail(to: string, lang = 'en') {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const loginUrl = `${frontendUrl}/login`;

    const translations = await this.translateAll(lang, {
      subject: 'messages.email.adminCreatedSubject',
      header: 'messages.email.adminCreatedHeader',
      body: 'messages.email.adminCreatedBody',
      buttonText: 'messages.email.adminCreatedButton',
      footerMessage: 'messages.email.footerAutomated',
    });

    const context = await this.getTemplateContext(lang, {
      ...translations,
      loginUrl,
    });

    const template = this.getTemplate('admin-congratulations.hbs');

    const html = template(context);

    return this.sendEmail(to, translations.subject, html);
  }

  async sendAdminUpdatedEmail(to: string, lang = 'en') {
    const translations = await this.translateAll(lang, {
      subject: 'messages.email.adminUpdatedSubject',
      header: 'messages.email.adminUpdatedHeader',
      body: 'messages.email.adminUpdatedBody',
      footerMessage: 'messages.email.footerAutomated',
    });

    const context = await this.getTemplateContext(lang, {
      ...translations,
      loginUrl: null,
    });

    const template = this.getTemplate('admin-congratulations.hbs');

    const html = template(context);

    return this.sendEmail(to, translations.subject, html);
  }

  async sendAdminDeletedEmail(to: string, lang = 'en') {
    const translations = await this.translateAll(lang, {
      subject: 'messages.email.adminDeletedSubject',
      header: 'messages.email.adminDeletedHeader',
      body: 'messages.email.adminDeletedBody',
      footerMessage: 'messages.email.footerAutomated',
    });

    const context = await this.getTemplateContext(lang, {
      ...translations,
      loginUrl: null,
    });

    const template = this.getTemplate('admin-congratulations.hbs');

    const html = template(context);

    return this.sendEmail(to, translations.subject, html);
  }
}

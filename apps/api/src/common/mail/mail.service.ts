// src/common/mail/mail.service.ts — email sender (Resend preferred, SMTP/dev fallback).
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY") || this.configService.get<string>("resend.apiKey");
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendVerificationEmail(email: string, verifyUrl: string): Promise<void> {
    const subject = "Verify your nibash email";
    const text = `Welcome to nibash!\n\nVerify your email address by opening this link:\n${verifyUrl}\n\nIf you did not create an account, you can ignore this email.`;
    const html = this.wrapHtml(
      "Verify your email",
      `<p>Welcome to <strong>Nibash</strong>!</p><p>Confirm your email address to activate your account.</p>`,
      verifyUrl,
      "Verify email",
    );
    await this.send(email, subject, text, html);
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const subject = "Reset your nibash password";
    const text = `We received a request to reset your nibash password.\n\nReset it by opening this link:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
    const html = this.wrapHtml(
      "Reset your password",
      `<p>We received a request to reset your <strong>Nibash</strong> password.</p><p>If this was you, use the button below to set a new password.</p>`,
      resetUrl,
      "Reset password",
    );
    await this.send(email, subject, text, html);
  }

  private async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    const from =
      this.configService.get<string>("MAIL_FROM") ||
      this.configService.get<string>("SMTP_FROM") ||
      "Nibash <onboarding@resend.dev>";

    if (this.resend) {
      const { error } = await this.resend.emails.send({
        from,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
      });
      if (error) {
        this.logger.error(`Resend send failed for ${to}: ${error.message}`);
        throw new Error(`Failed to send email: ${error.message}`);
      }
      this.logger.log(`Email sent via Resend to ${to}: ${subject}`);
      return;
    }

    const host = this.configService.get<string>("SMTP_HOST");
    if (!host) {
      this.logger.warn(`[DEV MAIL] To: ${to} | Subject: ${subject}\n${text}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>("SMTP_PORT") ?? 587,
      secure: false,
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
    });
    await transporter.sendMail({ from, to, subject, text, ...(html ? { html } : {}) });
    this.logger.log(`Email sent via SMTP to ${to}: ${subject}`);
  }

  private wrapHtml(title: string, intro: string, actionUrl: string, actionLabel: string): string {
    return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${title}</h1>
          <div style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">${intro}</div>
          <p style="margin:0 0 20px;">
            <a href="${actionUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">${actionLabel}</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="margin:0;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${actionUrl}" style="color:#2563eb;">${actionUrl}</a></p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}

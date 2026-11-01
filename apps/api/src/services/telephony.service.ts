import { prisma } from '../lib/prisma.js';

export interface SendSmsOptions {
  to: string; // phone number (09..., 07..., +251...)
  message: string;
  senderId?: string;
  campaignId?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface OmniDispatchOptions {
  tenantId: string;
  userId?: string;
  phone?: string;
  email?: string;
  title: string;
  message: string;
  html?: string;
  link?: string;
}

/**
 * Enterprise Telephony & Omni-Channel Notification Gateway
 * Integrated with:
 * - AfroMessage (Ethiopia's primary carrier SMS gateway for Ethio Telecom & Safaricom)
 * - Resend / SendGrid (Transactional HTML Emails)
 * - In-App Push & WebSocket fallback
 */
export class TelephonyService {
  /**
   * Normalize Ethiopian phone numbers to international E.164 (+251...)
   */
  static normalizeEthiopianPhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+251')) return cleaned;
    if (cleaned.startsWith('251')) return `+${cleaned}`;
    if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
      return `+251${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('9') || cleaned.startsWith('7')) {
      return `+251${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Dispatch SMS via AfroMessage API
   */
  static async sendSms(options: SendSmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const normalizedTo = this.normalizeEthiopianPhone(options.to);
    const token = process.env.AFROMESSAGE_API_KEY;

    // Sandbox / Mock Mode when API key is not configured in environment
    if (!token || token.startsWith('mock_')) {
      console.log(`[AfroMessage Mock SMS] -> ${normalizedTo}: "${options.message.slice(0, 60)}..."`);
      return {
        success: true,
        messageId: `mock_afro_${Date.now()}`,
      };
    }

    try {
      const response = await fetch('https://api.afromessage.com/api/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: normalizedTo,
          message: options.message,
          sender: options.senderId || process.env.AFROMESSAGE_SENDER_NAME || 'SchoolSMS',
          campaign: options.campaignId,
        }),
      });

      const data = await response.json() as any;

      if (response.ok && (data.acknowledge === 'success' || data.status === 'success')) {
        return {
          success: true,
          messageId: data.response?.id || data.id,
        };
      }

      return {
        success: false,
        error: data.message || 'AfroMessage returned failure response',
      };
    } catch (err: any) {
      return {
        success: false,
        error: `AfroMessage request exception: ${err.message}`,
      };
    }
  }

  /**
   * Dispatch Transactional Email via Resend / SendGrid API
   */
  static async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const defaultFrom = options.from || process.env.DEFAULT_FROM_EMAIL || 'School Portal <noreply@school.et>';

    if (!resendApiKey || resendApiKey.startsWith('mock_')) {
      console.log(`[Resend Mock Email] -> ${options.to} | Subject: "${options.subject}"`);
      return {
        success: true,
        id: `mock_email_${Date.now()}`,
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: defaultFrom,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || `<p>${options.text}</p>`,
        }),
      });

      const data = await response.json() as any;

      if (response.ok && data.id) {
        return { success: true, id: data.id };
      }

      return {
        success: false,
        error: data.message || 'Email delivery failed',
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Email transport exception: ${err.message}`,
      };
    }
  }

  /**
   * Omni-Channel Dispatcher: Attempts In-App, SMS, and Email with graceful degradation
   */
  static async sendOmniNotification(options: OmniDispatchOptions) {
    const results = {
      inApp: false,
      sms: false,
      email: false,
    };

    // 1. In-App Notification (Always prioritized)
    if (options.userId) {
      try {
        await prisma.notification.create({
          data: {
            tenantId: options.tenantId,
            userId: options.userId,
            title: options.title,
            message: options.message,
            link: options.link,
            type: 'INFO',
          },
        });
        results.inApp = true;
      } catch (err) {
        console.warn('In-app notification failure:', err);
      }
    }

    // 2. SMS (If phone available)
    if (options.phone) {
      const smsRes = await this.sendSms({
        to: options.phone,
        message: `${options.title}: ${options.message}`,
      });
      results.sms = smsRes.success;
    }

    // 3. Email (If email available)
    if (options.email) {
      const emailRes = await this.sendEmail({
        to: options.email,
        subject: options.title,
        text: options.message,
        html: options.html || `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px;">
            <h2 style="color: #1B4F8C;">${options.title}</h2>
            <p style="font-size: 16px; line-height: 1.5;">${options.message}</p>
            ${options.link ? `<p><a href="${options.link}" style="display:inline-block; padding:10px 18px; background:#1B4F8C; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">View in Portal</a></p>` : ''}
            <hr style="border:0; border-top:1px solid #eee; margin:30px 0;" />
            <p style="font-size: 12px; color: #888;">This is an automated notification from your School Management Portal.</p>
          </div>
        `,
      });
      results.email = emailRes.success;
    }

    return results;
  }
}

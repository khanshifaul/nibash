import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as webpush from "web-push";
import { DatabaseService } from "../database/database.service";

type PushPayload = { title: string; body?: string; url?: string; [k: string]: unknown };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly configured: boolean;
  private readonly publicKey: string;

  constructor(
    private readonly prisma: DatabaseService,
    private readonly config: ConfigService,
  ) {
    this.publicKey = this.config.get<string>("vapid.publicKey") ?? "";
    const privateKey = this.config.get<string>("vapid.privateKey") ?? "";
    const subject = this.config.get<string>("vapid.subject") ?? "mailto:support@nibash.local";
    this.configured = !!(this.publicKey && privateKey);
    if (this.configured) {
      webpush.setVapidDetails(subject, this.publicKey, privateKey);
    } else {
      this.logger.warn("VAPID keys not configured; web push notifications disabled");
    }
  }

  getPublicKey() {
    return { publicKey: this.publicKey, enabled: this.configured };
  }

  async subscribe(
    userId: string,
    dto: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId, endpoint: dto.endpoint } },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { ok: true };
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.configured) return { sent: 0, skipped: true };
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status;
        if (status === 404 || status === 410) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          this.logger.warn(`Push send failed for ${sub.id}: ${err?.message ?? err}`);
        }
      }
    }
    return { sent, skipped: false };
  }
}

// src/common/mail/mail.module.ts — Mail module (Resend + SMTP fallback).
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MailService } from "./mail.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

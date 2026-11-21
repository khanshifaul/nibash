// src/app.module.ts — app wiring with config, global DB, auth, domain modules.
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ApartmentsModule } from "./apartments/apartments.module";
import { AuthModule } from "./auth/auth.module";
import { BuildingsModule } from "./buildings/buildings.module";
import { AccessTokenGuard } from "./common/guards/access-token.guard";
import { appConfig } from "./config/app.config";
import { validationSchema } from "./config/validation.schema";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { InquiriesModule } from "./inquiries/inquiries.module";
import { MediaModule } from "./media/media.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SearchModule } from "./search/search.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema,
      envFilePath: [".env.local", ".env"],
    }),
    DatabaseModule,
    AuthModule,
    BuildingsModule,
    ApartmentsModule,
    MediaModule,
    SearchModule,
    InquiriesModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AccessTokenGuard }],
})
export class AppModule {}

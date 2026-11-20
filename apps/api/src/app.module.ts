// src/app.module.ts — app wiring with config, global DB, auth, domain modules.
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "./config/app.config";
import { validationSchema } from "./config/validation.schema";
import { DatabaseModule } from "./database/database.module";
import { AccessTokenGuard } from "./common/guards/access-token.guard";
import { AuthModule } from "./auth/auth.module";
import { BuildingsModule } from "./buildings/buildings.module";
import { ApartmentsModule } from "./apartments/apartments.module";
import { MediaModule } from "./media/media.module";
import { SearchModule } from "./search/search.module";
import { InquiriesModule } from "./inquiries/inquiries.module";
import { HealthController } from "./health.controller";

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
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AccessTokenGuard }],
})
export class AppModule {}

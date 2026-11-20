// src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { MailModule } from "../common/mail/mail.module";
import { DatabaseModule } from "../database/database.module";
import { AuthenticationController } from "./authentication/authentication.controller";
import { AuthenticationService } from "./authentication/authentication.service";
import { JwtStrategy } from "./token/strategies/jwt.strategy";

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: (configService.get<string>("jwt.secret") ??
          configService.get<string>("JWT_SECRET")) as string,
        signOptions: {
          expiresIn: (configService.get<string>("jwt.accessExpiresIn") ?? "15m") as any,
        },
      }),
    }),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, JwtStrategy],
  exports: [AuthenticationService],
})
export class AuthModule {}

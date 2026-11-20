// src/auth/token/strategies/google.strategy.ts — Google OAuth 2.0 strategy.
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type VerifyCallback } from "passport-google-oauth20";
import { DatabaseService } from "../../../database/database.service";
import { AuthenticationService } from "../../authentication/authentication.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly prisma: DatabaseService,
    private readonly authService: AuthenticationService,
    configService: ConfigService,
  ) {
    const clientId =
      configService.get<string>("google.clientId") ?? configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret =
      configService.get<string>("google.clientSecret") ??
      configService.get<string>("GOOGLE_CLIENT_SECRET");
    const callbackURL =
      configService.get<string>("google.callbackURL") ??
      configService.get<string>("GOOGLE_CALLBACK_URL");

    if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");
    if (!clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is not configured");
    if (!callbackURL) throw new Error("GOOGLE_CALLBACK_URL is not configured");

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const name = profile.displayName ?? null;
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    if (!email || !googleId) {
      this.logger.warn("Google profile missing email or id");
      return done(new UnauthorizedException("Google account missing email"), false);
    }

    try {
      // Link existing local account or create a new social user.
      let user = await this.prisma.user.findUnique({ where: { googleId } });

      if (!user) {
        user = await this.prisma.user.findUnique({ where: { email } });
        if (user) {
          // Merge: attach googleId to existing local account.
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              provider: "google",
              googleId,
              avatarUrl: avatarUrl ?? user.avatarUrl,
            },
          });
        } else {
          // New social-only user (email verified by Google).
          user = await this.prisma.user.create({
            data: {
              email,
              name,
              avatarUrl,
              provider: "google",
              googleId,
              isEmailVerified: true,
            },
          });
        }
      }

      const tokens = await this.authService.authenticateWithGoogle(user.id);
      done(null, { ...user, ...tokens, sub: user.id });
    } catch (err) {
      this.logger.error(err);
      done(new UnauthorizedException("Google authentication failed"), false);
    }
  }
}

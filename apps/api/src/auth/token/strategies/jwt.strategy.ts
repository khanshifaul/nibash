// src/auth/token/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AUTH_COOKIE } from "../../../common/cookie.util";
import type { DatabaseService } from "../../../database/database.service";
import type { JwtPayload } from "../../common/interfaces/jwt-payload.interface";

function cookieOrBearerExtractor(req: Request): string | null {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const fromCookie = cookies?.[AUTH_COOKIE];
  if (fromCookie) return fromCookie;
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private readonly prisma: DatabaseService,
  ) {
    const secret =
      configService.get<string>("jwt.secret") ?? configService.get<string>("JWT_SECRET");
    if (!secret) throw new Error("JWT_SECRET is not configured");

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieOrBearerExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isEmailVerified: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return { ...user, sub: user.id };
  }
}

// src/auth/authentication/authentication.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { DatabaseService } from "../../database/database.service";
import { MailService } from "../../common/mail/mail.service";
import { JwtPayload } from "../common/interfaces/jwt-payload.interface";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isEmailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly prisma: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(email: string, password: string, name?: string, phone?: string): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { token, hash, expires } = this.generateToken(24 * 60 * 60 * 1000); // 24h

    const user = await this.prisma.user.create({
      data: {
        email,
        name: name ?? null,
        phone: phone ?? null,
        passwordHash,
        isEmailVerified: false,
        emailVerificationToken: hash,
        emailVerificationExpires: expires,
      },
      select: { id: true, email: true, name: true, phone: true, isEmailVerified: true },
    });

    await this.sendVerificationEmail(user.email, token);
    const tokens = await this.issueTokens(user.id, user.email, false);
    this.logger.log(`Registered user ${user.email}`);
    return { user, ...tokens };
  }

  async login(email: string, password: string, rememberMe = false): Promise<AuthResult> {
    const user = await this.validateUser(email, password);
    const tokens = await this.issueTokens(user.id, user.email, rememberMe);
    this.logger.log(`Login ${user.email}`);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid email or password");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid email or password");
    return user;
  }

  async verifyEmail(token: string): Promise<{ verified: boolean; email: string }> {
    const hash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: hash,
        emailVerificationExpires: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException("Invalid or expired verification link");

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
    return { verified: true, email: user.email };
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // don't reveal existence
    if (user.isEmailVerified) return;

    const { token, hash, expires } = this.generateToken(24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: hash, emailVerificationExpires: expires },
    });
    await this.sendVerificationEmail(user.email, token);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // don't reveal existence

    const { token, hash, expires } = this.generateToken(60 * 60 * 1000); // 1h
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hash, resetTokenExpires: expires },
    });

    const webOrigin = this.configService.get<string>("webOrigin") ?? "http://localhost:3004";
    const resetUrl = `${webOrigin}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: { resetToken: hash, resetTokenExpires: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException("Invalid or expired reset link");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });
    // Revoke all refresh tokens on password reset
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async refresh(refreshTokenRaw: string): Promise<AuthTokens> {
    if (!refreshTokenRaw) throw new UnauthorizedException("Missing refresh token");
    const hash = this.hashToken(refreshTokenRaw);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user.id, stored.user.email, false);
  }

  async logout(refreshTokenRaw?: string): Promise<void> {
    if (!refreshTokenRaw) return;
    const hash = this.hashToken(refreshTokenRaw);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, isEmailVerified: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<AuthUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: data.name, phone: data.phone },
      select: { id: true, email: true, name: true, phone: true, isEmailVerified: true },
    });
    return user;
  }

  private async issueTokens(userId: string, email: string, rememberMe: boolean): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, type: "access" } satisfies JwtPayload,
    );

    const refreshRaw = crypto.randomBytes(48).toString("hex");
    const refreshHash = this.hashToken(refreshRaw);
    const days = rememberMe
      ? (this.configService.get<number>("jwt.refreshExpiresInDays") ?? 30)
      : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: refreshHash, expiresAt },
    });

    return { accessToken, refreshToken: refreshRaw };
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    const webOrigin = this.configService.get<string>("webOrigin") ?? "http://localhost:3004";
    const verifyUrl = `${webOrigin}/verify-email?token=${encodeURIComponent(token)}`;
    await this.mailService.sendVerificationEmail(email, verifyUrl);
  }

  private generateToken(ttlMs: number): { token: string; hash: string; expires: Date } {
    const token = crypto.randomBytes(32).toString("hex");
    return { token, hash: this.hashToken(token), expires: new Date(Date.now() + ttlMs) };
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    isEmailVerified: boolean;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
    };
  }
}

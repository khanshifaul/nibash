// src/auth/authentication/authentication.controller.ts
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../../common/cookie.util";
import { Public } from "../../common/decorators/public.decorator";
import { User } from "../../common/decorators/user.decorator";
import { AuthenticationService, AuthResult } from "./authentication.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/reset-password.dto";
import { ResendVerificationDto, VerifyEmailDto } from "./dto/verify-email.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Public()
  @Post("register")
  @ApiOperation({
    summary: "Register with email and password (sends verification email)",
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    success: boolean;
    message: string;
    data: Omit<AuthResult, "refreshToken">;
  }> {
    const result = await this.authService.register(dto.email, dto.password, dto.name, dto.phone);
    setAuthCookies(res, result.accessToken, result.refreshToken, false);
    return {
      success: true,
      message: "Registration successful. Please verify your email.",
      data: { user: result.user, accessToken: result.accessToken },
    };
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    success: boolean;
    message: string;
    data: Omit<AuthResult, "refreshToken">;
  }> {
    const result = await this.authService.login(dto.email, dto.password, dto.rememberMe ?? false);
    setAuthCookies(res, result.accessToken, result.refreshToken, dto.rememberMe ?? false);
    return {
      success: true,
      message: "Login successful",
      data: { user: result.user, accessToken: result.accessToken },
    };
  }

  @Public()
  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email using token from verification link" })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto.token);
    return {
      success: true,
      message: "Email verified successfully",
      data: result,
    };
  }

  @Public()
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend verification email" })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto.email);
    return {
      success: true,
      message: "If the account exists, a verification email has been sent.",
    };
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset link" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      success: true,
      message: "If the account exists, a reset link has been sent.",
    };
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password using token from reset link" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      success: true,
      message: "Password reset successful. Please log in.",
    };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token using refresh cookie" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const refreshToken = cookies?.[REFRESH_COOKIE];
    const tokens = await this.authService.refresh(refreshToken ?? "");
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, false);
    return {
      success: true,
      message: "Token refreshed",
      data: { accessToken: tokens.accessToken },
    };
  }

  @Public()
  @Get("me")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({
    summary: "Get current user profile (returns null when unauthenticated)",
  })
  async me(@User("id") userId: string | undefined) {
    if (!userId) {
      return { success: true, data: null };
    }
    const profile = await this.authService.getProfile(userId);
    return { success: true, data: profile };
  }

  @Patch("me")
  @ApiBearerAuth()
  @ApiCookieAuth("nibash_token")
  @ApiOperation({ summary: "Update current user profile (name, phone)" })
  async updateMe(@User("id") userId: string, @Body() body: { name?: string; phone?: string }) {
    const profile = await this.authService.updateProfile(userId, body);
    return { success: true, data: profile };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout and clear auth cookies" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    await this.authService.logout(cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(res);
    return { success: true, message: "Logged out" };
  }
}

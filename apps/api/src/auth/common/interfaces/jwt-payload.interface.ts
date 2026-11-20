// src/auth/common/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;
  email: string;
  type?: "access" | "refresh";
  iat?: number;
  exp?: number;
}

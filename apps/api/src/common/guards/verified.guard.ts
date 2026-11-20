import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { isEmailVerified?: boolean } | undefined;
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }
    if (!user.isEmailVerified) {
      throw new ForbiddenException("Email verification required");
    }
    return true;
  }
}

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@/common/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Check if user exists (handled by JwtAuthGuard usually, but safe to check)
    if (!user || (!user.role && !user.roles)) {
      return false;
    }

    // Role hierarchy checking could go here, but simple matching for now
    const userRoles = user.roles || (user.role ? [user.role] : []);
    return requiredRoles.some((role) => userRoles.includes(role as any));
  }
}

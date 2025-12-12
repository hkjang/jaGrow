import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AdminRoleType } from '../decorators/roles.decorator';
import { RbacService } from '../services/rbac.service';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('[AdminRoleGuard] Required roles:', requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('[AdminRoleGuard] No roles required, allowing access');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('[AdminRoleGuard] User from request:', user);

    if (!user || !user.id) {
      console.log('[AdminRoleGuard] No user or user.id, denying access');
      return false;
    }

    const effectiveRoles = await this.rbacService.getEffectiveRoles(user.id);
    console.log('[AdminRoleGuard] Effective roles for user', user.id, ':', effectiveRoles);

    const hasAccess = requiredRoles.some((role) => effectiveRoles.includes(role));
    console.log('[AdminRoleGuard] Has access:', hasAccess);
    
    return hasAccess;
  }
}

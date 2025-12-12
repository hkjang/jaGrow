import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminRoleType } from '../decorators/roles.decorator';

interface PermissionCheck {
  resource: string;
  action: string;
  scope?: string;
}

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async getUserRoles(userId: string) {
    return this.prisma.adminRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { permissions: true },
    });
  }

  async hasRole(userId: string, roleType: AdminRoleType): Promise<boolean> {
    const role = await this.prisma.adminRole.findFirst({
      where: {
        userId,
        roleType,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    return !!role;
  }

  async hasPermission(userId: string, check: PermissionCheck): Promise<boolean> {
    const roles = await this.getUserRoles(userId);

    // SuperAdmin has all permissions
    if (roles.some((role) => role.roleType === 'SUPER_ADMIN')) {
      return true;
    }

    // Check explicit permissions
    for (const role of roles) {
      for (const permission of role.permissions) {
        if (
          permission.resource === check.resource &&
          permission.action === check.action &&
          (permission.scope === '*' || permission.scope === check.scope)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  async assertPermission(userId: string, check: PermissionCheck): Promise<void> {
    const hasAccess = await this.hasPermission(userId, check);
    if (!hasAccess) {
      throw new ForbiddenException(
        `User does not have permission: ${check.action} on ${check.resource}`,
      );
    }
  }

  async assignRole(
    userId: string,
    roleType: AdminRoleType,
    grantedBy: string,
    expiresAt?: Date,
  ) {
    return this.prisma.adminRole.upsert({
      where: {
        userId_roleType: {
          userId,
          roleType,
        },
      },
      update: {
        isActive: true,
        grantedBy,
        expiresAt,
        grantedAt: new Date(),
      },
      create: {
        userId,
        roleType,
        grantedBy,
        expiresAt,
      },
    });
  }

  async revokeRole(userId: string, roleType: AdminRoleType) {
    return this.prisma.adminRole.updateMany({
      where: { userId, roleType },
      data: { isActive: false },
    });
  }

  async addPermission(
    roleId: string,
    resource: string,
    action: string,
    scope?: string,
  ) {
    return this.prisma.permission.create({
      data: {
        roleId,
        resource,
        action,
        scope: scope || '*',
      },
    });
  }

  async removePermission(permissionId: string) {
    return this.prisma.permission.delete({
      where: { id: permissionId },
    });
  }

  async grantTemporaryAccess(
    userId: string,
    roleType: AdminRoleType,
    grantedBy: string,
    durationMinutes: number,
  ) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    return this.assignRole(userId, roleType, grantedBy, expiresAt);
  }

  async cleanupExpiredRoles() {
    const result = await this.prisma.adminRole.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: { isActive: false },
    });
    return result.count;
  }

  // Role hierarchy for permission inheritance
  private readonly roleHierarchy: Record<AdminRoleType, AdminRoleType[]> = {
    SUPER_ADMIN: ['ORG_ADMIN', 'DATA_OPS', 'AD_OPS', 'PRODUCT_OWNER', 'AUDITOR'],
    ORG_ADMIN: ['DATA_OPS', 'AD_OPS', 'PRODUCT_OWNER'],
    DATA_OPS: [],
    AD_OPS: [],
    PRODUCT_OWNER: [],
    AUDITOR: [],
  };

  async getEffectiveRoles(userId: string): Promise<AdminRoleType[]> {
    const roles = await this.getUserRoles(userId);
    const effectiveRoles = new Set<AdminRoleType>();

    for (const role of roles) {
      effectiveRoles.add(role.roleType);
      // Add inherited roles
      for (const inherited of this.roleHierarchy[role.roleType] || []) {
        effectiveRoles.add(inherited);
      }
    }

    return Array.from(effectiveRoles);
  }
}

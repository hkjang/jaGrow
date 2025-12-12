import { Injectable, Logger, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

// Custom decorator for ad account access
export const RequireAdAccountAccess = (permissionLevel: 'read' | 'write' | 'admin' = 'read') =>
  (target: object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    if (descriptor) {
      Reflect.defineMetadata('adAccountPermission', permissionLevel, descriptor.value);
    }
    return descriptor;
  };

@Injectable()
export class AdAccountAccessGuard implements CanActivate {
  private readonly logger = new Logger(AdAccountAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const adAccountId = request.params.adAccountId || request.body.adAccountId;

    if (!user || !adAccountId) {
      return false;
    }

    const requiredPermission = this.reflector.get<string>('adAccountPermission', context.getHandler()) || 'read';

    // Check if user has access to this ad account
    const hasAccess = await this.checkUserAdAccountAccess(user.id, adAccountId, requiredPermission);

    if (!hasAccess) {
      this.logger.warn(`User ${user.id} denied access to ad account ${adAccountId} (required: ${requiredPermission})`);
    }

    return hasAccess;
  }

  private async checkUserAdAccountAccess(
    userId: string,
    adAccountId: string,
    permission: string,
  ): Promise<boolean> {
    // Get user's organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user?.organization) {
      return false;
    }

    // Check if ad account belongs to user's organization
    const adAccount = await this.prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        organizationId: user.organizationId || '',
      },
    });

    if (!adAccount) {
      return false;
    }

    // Check permission level based on user role
    switch (permission) {
      case 'admin':
        return user.role === 'ADMIN';
      case 'write':
        return user.role === 'ADMIN' || user.role === 'EDITOR';
      case 'read':
      default:
        return true; // All roles can read
    }
  }
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ====================================================
  // Ad Account Access Control
  // ====================================================

  /**
   * Get all ad accounts a user has access to
   */
  async getUserAdAccounts(userId: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            adAccounts: true,
          },
        },
      },
    });

    return user?.organization?.adAccounts || [];
  }

  /**
   * Check if user can perform action on ad account
   */
  async canPerformAction(
    userId: string,
    adAccountId: string,
    action: 'view' | 'edit' | 'delete' | 'manage',
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Check organization ownership
    const adAccount = await this.prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        organizationId: user.organizationId || '',
      },
    });

    if (!adAccount) return false;

    // Role-based permissions
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['view', 'edit', 'delete', 'manage'],
      EDITOR: ['view', 'edit'],
      VIEWER: ['view'],
    };

    return rolePermissions[user.role]?.includes(action) || false;
  }

  // ====================================================
  // Experiment Change Approval Workflow
  // ====================================================

  /**
   * Request experiment change approval
   */
  async requestExperimentApproval(
    requesterId: string,
    experimentId: string,
    changeType: 'create' | 'update' | 'delete' | 'start' | 'stop',
    changeDetails: any,
  ): Promise<{ approvalId: string; status: string }> {
    // For now, auto-approve for admins
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (requester?.role === 'ADMIN') {
      return { approvalId: 'auto-approved', status: 'approved' };
    }

    // Log the approval request (in production, create ApprovalRequest record)
    this.logger.log(`Experiment approval request: ${experimentId} - ${changeType} by ${requesterId}`);

    return { approvalId: `pending-${Date.now()}`, status: 'pending' };
  }

  /**
   * Approve experiment change
   */
  async approveExperimentChange(
    approverId: string,
    approvalId: string,
  ): Promise<boolean> {
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
    });

    if (approver?.role !== 'ADMIN') {
      this.logger.warn(`Non-admin ${approverId} attempted to approve ${approvalId}`);
      return false;
    }

    // Process approval
    this.logger.log(`Experiment change ${approvalId} approved by ${approverId}`);
    return true;
  }

  // ====================================================
  // API Permission Levels
  // ====================================================

  /**
   * Check API permission level
   */
  async checkAPIPermission(
    userId: string,
    endpoint: string,
    method: string,
  ): Promise<{ allowed: boolean; rateLimit: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { allowed: false, rateLimit: 0 };
    }

    // Define rate limits by role
    const rateLimits: Record<string, number> = {
      ADMIN: 10000,  // 10k requests/hour
      EDITOR: 5000,  // 5k requests/hour
      VIEWER: 1000,  // 1k requests/hour
    };

    // Define restricted endpoints
    const adminOnlyEndpoints = [
      '/api/admin/*',
      '/api/settings/*',
      '/api/users/delete',
    ];

    const editorEndpoints = [
      '/api/experiments/create',
      '/api/experiments/update',
      '/api/campaigns/update',
    ];

    // Check endpoint restrictions
    const isAdminOnly = adminOnlyEndpoints.some(pattern => 
      this.matchEndpoint(endpoint, pattern)
    );

    const isEditorEndpoint = editorEndpoints.some(pattern =>
      this.matchEndpoint(endpoint, pattern)
    );

    let allowed = true;

    if (isAdminOnly && user.role !== 'ADMIN') {
      allowed = false;
    }

    if (isEditorEndpoint && user.role === 'VIEWER') {
      allowed = false;
    }

    return {
      allowed,
      rateLimit: rateLimits[user.role] || 100,
    };
  }

  private matchEndpoint(endpoint: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(endpoint);
  }

  /**
   * Log API call for audit
   */
  async logAPICall(
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
  ): Promise<void> {
    // In production, this would write to audit log table
    this.logger.debug(`API: ${method} ${endpoint} - User: ${userId} - Status: ${statusCode} - Time: ${responseTime}ms`);
  }
}

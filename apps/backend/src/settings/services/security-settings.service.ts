import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class SecuritySettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // AccessPolicy CRUD
  // =====================
  async createAccessPolicy(data: Prisma.AccessPolicyCreateInput) {
    return this.prisma.accessPolicy.create({ data });
  }

  async findAllAccessPolicies(tenantId?: string) {
    return this.prisma.accessPolicy.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAccessPolicyById(id: string) {
    return this.prisma.accessPolicy.findUnique({ where: { id } });
  }

  async updateAccessPolicy(id: string, data: Prisma.AccessPolicyUpdateInput) {
    return this.prisma.accessPolicy.update({
      where: { id },
      data,
    });
  }

  async deleteAccessPolicy(id: string) {
    return this.prisma.accessPolicy.delete({ where: { id } });
  }

  async findActiveAccessPolicies(tenantId?: string) {
    return this.prisma.accessPolicy.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findAccessPoliciesByType(policyType: string, tenantId?: string) {
    return this.prisma.accessPolicy.findMany({
      where: {
        policyType,
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async checkIpAccess(ip: string, tenantId?: string): Promise<boolean> {
    const whitelists = await this.findAccessPoliciesByType('ip_whitelist', tenantId);
    const blacklists = await this.findAccessPoliciesByType('ip_blacklist', tenantId);

    // Check blacklist first
    for (const policy of blacklists) {
      if (this.isIpInRange(ip, policy.ipRange)) {
        return false;
      }
    }

    // If whitelist exists, IP must be in it
    if (whitelists.length > 0) {
      for (const policy of whitelists) {
        if (this.isIpInRange(ip, policy.ipRange)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  private isIpInRange(ip: string, cidr: string): boolean {
    // Simple IP range check - can be enhanced with proper CIDR calculation
    if (cidr === '*' || cidr === '0.0.0.0/0') return true;
    if (!cidr.includes('/')) return ip === cidr;

    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  // =====================
  // ApiKeyConfig CRUD
  // =====================
  async createApiKey(data: Omit<Prisma.ApiKeyConfigCreateInput, 'apiKey'>) {
    return this.prisma.apiKeyConfig.create({
      data: {
        ...data,
        apiKey: randomUUID(),
      },
    });
  }

  async findAllApiKeys(tenantId?: string) {
    return this.prisma.apiKeyConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApiKeyById(id: string) {
    return this.prisma.apiKeyConfig.findUnique({ where: { id } });
  }

  async findByApiKey(apiKey: string) {
    return this.prisma.apiKeyConfig.findUnique({ where: { apiKey } });
  }

  async updateApiKey(id: string, data: Prisma.ApiKeyConfigUpdateInput) {
    return this.prisma.apiKeyConfig.update({
      where: { id },
      data,
    });
  }

  async deleteApiKey(id: string) {
    return this.prisma.apiKeyConfig.delete({ where: { id } });
  }

  async regenerateApiKey(id: string) {
    return this.prisma.apiKeyConfig.update({
      where: { id },
      data: { apiKey: randomUUID() },
    });
  }

  async updateLastUsed(id: string) {
    return this.prisma.apiKeyConfig.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async findActiveApiKeys(tenantId?: string) {
    return this.prisma.apiKeyConfig.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  async validateApiKey(apiKey: string, requiredPermission?: string): Promise<boolean> {
    const keyConfig = await this.findByApiKey(apiKey);
    if (!keyConfig || !keyConfig.isActive) return false;
    if (keyConfig.expiresAt && keyConfig.expiresAt < new Date()) return false;
    if (requiredPermission && !keyConfig.permissions.includes(requiredPermission)) return false;

    await this.updateLastUsed(keyConfig.id);
    return true;
  }
}

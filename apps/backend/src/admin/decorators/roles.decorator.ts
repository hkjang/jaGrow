import { SetMetadata } from '@nestjs/common';

// Define locally to avoid dependency on Prisma generated types
export type AdminRoleType =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'DATA_OPS'
  | 'AD_OPS'
  | 'PRODUCT_OWNER'
  | 'AUDITOR';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRoleType[]) => SetMetadata(ROLES_KEY, roles);

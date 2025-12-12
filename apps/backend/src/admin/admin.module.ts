import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { TenantController } from './controllers/tenant.controller';
import { IntegrationController } from './controllers/integration.controller';
import { ExperimentApprovalController } from './controllers/experiment-approval.controller';
import { RuleSimulatorController } from './controllers/rule-simulator.controller';
import { AuditController } from './controllers/audit.controller';
import { SecurityController } from './controllers/security.controller';
import { CostQuotaController } from './controllers/cost-quota.controller';

// Services
import { TenantService } from './services/tenant.service';
import { IntegrationStatusService } from './services/integration-status.service';
import { ExperimentApprovalService } from './services/experiment-approval.service';
import { RuleSimulatorService } from './services/rule-simulator.service';
import { AuditService } from './services/audit.service';
import { SecurityService } from './services/security.service';
import { CostQuotaService } from './services/cost-quota.service';
import { RbacService } from './services/rbac.service';

// Guards
import { AdminRoleGuard } from './guards/admin-role.guard';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [PrismaModule],
  controllers: [
    TenantController,
    IntegrationController,
    ExperimentApprovalController,
    RuleSimulatorController,
    AuditController,
    SecurityController,
    CostQuotaController,
  ],
  providers: [
    TenantService,
    IntegrationStatusService,
    ExperimentApprovalService,
    RuleSimulatorService,
    AuditService,
    SecurityService,
    CostQuotaService,
    RbacService,
    AdminRoleGuard,
    PermissionGuard,
  ],
  exports: [
    TenantService,
    AuditService,
    RbacService,
    IntegrationStatusService,
    SecurityService,
  ],
})
export class AdminModule {}

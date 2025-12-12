import { PrismaClient, Prisma, Role, ExperimentStatus, AdPlatform, AdminRoleType, NotificationType, NotificationChannel, IntegrationPlatform } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================
// Helper Functions
// ============================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDateRange(days: number): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  return dates;
}

function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date;
}

// ============================================
// Seed Data Constants
// ============================================

const ORGANIZATIONS = [
  { name: '테크스타트업 주식회사', plan: 'enterprise' },
  { name: '디지털마케팅 에이전시', plan: 'pro' },
  { name: '이커머스 솔루션즈', plan: 'free' },
];

const USERS_PER_ORG = [
  // Org 1: 테크스타트업
  [
    { email: 'admin@techstartup.kr', name: '김철수', role: Role.ADMIN },
    { email: 'editor1@techstartup.kr', name: '이영희', role: Role.EDITOR },
    { email: 'editor2@techstartup.kr', name: '박민수', role: Role.EDITOR },
    { email: 'viewer1@techstartup.kr', name: '최지연', role: Role.VIEWER },
    { email: 'viewer2@techstartup.kr', name: '정현우', role: Role.VIEWER },
  ],
  // Org 2: 디지털마케팅
  [
    { email: 'admin@digitalmarketing.kr', name: '강서영', role: Role.ADMIN },
    { email: 'editor1@digitalmarketing.kr', name: '윤재호', role: Role.EDITOR },
    { email: 'editor2@digitalmarketing.kr', name: '송미래', role: Role.EDITOR },
    { email: 'viewer1@digitalmarketing.kr', name: '임도현', role: Role.VIEWER },
    { email: 'viewer2@digitalmarketing.kr', name: '한소희', role: Role.VIEWER },
  ],
  // Org 3: 이커머스
  [
    { email: 'admin@ecommerce.kr', name: '오준혁', role: Role.ADMIN },
    { email: 'editor1@ecommerce.kr', name: '장하늘', role: Role.EDITOR },
    { email: 'editor2@ecommerce.kr', name: '신예은', role: Role.EDITOR },
    { email: 'viewer1@ecommerce.kr', name: '권태형', role: Role.VIEWER },
    { email: 'viewer2@ecommerce.kr', name: '배수진', role: Role.VIEWER },
  ],
];

const EXPERIMENTS = [
  { name: '메인 페이지 히어로 배너 테스트', description: '새로운 히어로 배너 디자인의 전환율 비교', status: ExperimentStatus.RUNNING },
  { name: 'CTA 버튼 색상 테스트', description: '빨간색 vs 파란색 CTA 버튼의 클릭률 비교', status: ExperimentStatus.RUNNING },
  { name: '가격 표시 형식 테스트', description: '할인율 표시 vs 절대 금액 할인 표시 효과 비교', status: ExperimentStatus.ENDED },
  { name: '체크아웃 플로우 간소화', description: '단계 단축 체크아웃의 이탈률 비교', status: ExperimentStatus.RUNNING },
  { name: '제품 상세 페이지 레이아웃', description: '이미지 좌측 vs 우측 배치 비교', status: ExperimentStatus.PAUSED },
  { name: '뉴스레터 팝업 타이밍', description: '즉시 표시 vs 스크롤 후 표시 비교', status: ExperimentStatus.DRAFT },
];

const VARIATIONS_PER_EXPERIMENT = [
  [{ name: '기존 배너', key: 'control', weight: 50 }, { name: '새 배너', key: 'variant-a', weight: 50 }],
  [{ name: '파란색 버튼', key: 'control', weight: 50 }, { name: '빨간색 버튼', key: 'variant-a', weight: 50 }],
  [{ name: '할인율 표시', key: 'control', weight: 50 }, { name: '금액 할인 표시', key: 'variant-a', weight: 50 }],
  [{ name: '4단계 체크아웃', key: 'control', weight: 50 }, { name: '2단계 체크아웃', key: 'variant-a', weight: 50 }],
  [{ name: '이미지 좌측', key: 'control', weight: 50 }, { name: '이미지 우측', key: 'variant-a', weight: 50 }],
  [{ name: '즉시 팝업', key: 'control', weight: 50 }, { name: '스크롤 후 팝업', key: 'variant-a', weight: 50 }],
];

const AD_ACCOUNTS = [
  { platform: AdPlatform.GOOGLE, name: '테크스타트업 Google Ads', accountId: 'google_123456' },
  { platform: AdPlatform.META, name: '테크스타트업 Meta Ads', accountId: 'meta_789012' },
  { platform: AdPlatform.GOOGLE, name: '디지털마케팅 Google Ads', accountId: 'google_345678' },
  { platform: AdPlatform.META, name: '디지털마케팅 Meta Ads', accountId: 'meta_901234' },
  { platform: AdPlatform.TIKTOK, name: '이커머스 TikTok Ads', accountId: 'tiktok_567890' },
  { platform: AdPlatform.META, name: '이커머스 Meta Ads', accountId: 'meta_112233' },
];

const CAMPAIGNS_PER_ACCOUNT = [
  ['브랜드 인지도 캠페인', '리타겟팅 캠페인', '신제품 런칭 캠페인'],
  ['앱 설치 캠페인', '전환 캠페인', '리마케팅 캠페인'],
  ['검색 광고 캠페인', '디스플레이 캠페인', '쇼핑 캠페인'],
  ['인스타그램 스토리 캠페인', 'Facebook 뉴스피드 캠페인', '동영상 조회 캠페인'],
  ['브랜드 챌린지 캠페인', '인플루언서 콜라보', '제품 소개 캠페인'],
  ['DM 광고 캠페인', '라이브 쇼핑 광고', '카탈로그 판매 캠페인'],
];

const EVENT_NAMES = ['page_view', 'button_click', 'add_to_cart', 'checkout_start', 'purchase', 'newsletter_signup', 'search'];

const OPTIMIZATION_RULES = [
  {
    name: 'ROAS 저성과 캠페인 중지',
    description: 'ROAS가 100% 미만인 캠페인 자동 중지',
    ruleType: 'pause_low_performer',
    conditions: [{ metric: 'roas', operator: '<', value: 100 }],
    actions: [{ type: 'pause', params: {} }],
  },
  {
    name: '고성과 캠페인 예산 증가',
    description: 'ROAS가 300% 이상인 캠페인 예산 20% 증가',
    ruleType: 'increase_budget',
    conditions: [{ metric: 'roas', operator: '>=', value: 300 }],
    actions: [{ type: 'increase_budget', params: { percentage: 20 } }],
  },
  {
    name: 'CTR 저성과 광고 중지',
    description: 'CTR이 1% 미만인 광고 자동 중지',
    ruleType: 'pause_low_performer',
    conditions: [{ metric: 'ctr', operator: '<', value: 1 }],
    actions: [{ type: 'pause', params: {} }],
  },
  {
    name: '예산 소진 알림',
    description: '일일 예산 90% 이상 소진 시 알림',
    ruleType: 'expand_creative',
    conditions: [{ metric: 'spend_ratio', operator: '>=', value: 90 }],
    actions: [{ type: 'notify', params: { channel: 'slack' } }],
  },
  {
    name: 'CPC 상한 초과 예산 감소',
    description: 'CPC가 5000원 이상인 캠페인 예산 10% 감소',
    ruleType: 'decrease_budget',
    conditions: [{ metric: 'cpc', operator: '>=', value: 5000 }],
    actions: [{ type: 'decrease_budget', params: { percentage: 10 } }],
  },
];

const SEASONAL_PROFILES = [
  { name: '평일 업무시간', dayOfWeek: [1, 2, 3, 4, 5], hourOfDay: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18], monthOfYear: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], multiplier: 1.2 },
  { name: '주말 오후', dayOfWeek: [0, 6], hourOfDay: [12, 13, 14, 15, 16, 17, 18], monthOfYear: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], multiplier: 1.5 },
  { name: '연말 시즌', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], hourOfDay: Array.from({ length: 24 }, (_, i) => i), monthOfYear: [11, 12], multiplier: 2.0 },
  { name: '블랙프라이데이', dayOfWeek: [5], hourOfDay: Array.from({ length: 24 }, (_, i) => i), monthOfYear: [11], multiplier: 3.0 },
];

// ============================================
// Main Seed Function
// ============================================

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.$transaction([
    prisma.touchPoint.deleteMany(),
    prisma.userJourney.deleteMany(),
    prisma.adMetric.deleteMany(),
    prisma.ad.deleteMany(),
    prisma.adGroup.deleteMany(),
    prisma.adCampaign.deleteMany(),
    prisma.adAccount.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.variation.deleteMany(),
    prisma.experiment.deleteMany(),
    prisma.event.deleteMany(),
    prisma.attributionEvent.deleteMany(),
    prisma.performancePrediction.deleteMany(),
    prisma.anomalyAlert.deleteMany(),
    prisma.optimizationRule.deleteMany(),
    prisma.optimizationLog.deleteMany(),
    prisma.budgetAllocation.deleteMany(),
    prisma.notificationPreference.deleteMany(),
    prisma.notificationLog.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.adminRole.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.integrationStatus.deleteMany(),
    prisma.experimentApproval.deleteMany(),
    prisma.securityAlert.deleteMany(),
    prisma.piiRedactionJob.deleteMany(),
    prisma.costQuota.deleteMany(),
    prisma.schemaRegistry.deleteMany(),
    prisma.etlJob.deleteMany(),
    prisma.seasonalProfile.deleteMany(),
    prisma.tenant.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany(),
  ]);

  // ============================================
  // 1. Create Organizations
  // ============================================
  console.log('🏢 Creating organizations...');
  const organizations = await Promise.all(
    ORGANIZATIONS.map((org) =>
      prisma.organization.create({
        data: { name: org.name },
      })
    )
  );
  console.log(`   ✓ Created ${organizations.length} organizations`);

  // ============================================
  // 2. Create Tenants
  // ============================================
  console.log('🏠 Creating tenants...');
  const tenants = await Promise.all(
    organizations.map((org, index) =>
      prisma.tenant.create({
        data: {
          name: org.name,
          orgId: org.id,
          plan: ORGANIZATIONS[index].plan,
          eventsCount: BigInt(randomInt(10000, 1000000)),
          storageBytes: BigInt(randomInt(1000000, 100000000)),
          costEstimate: randomFloat(100, 5000),
          p95ResponseMs: randomFloat(50, 200),
        },
      })
    )
  );
  console.log(`   ✓ Created ${tenants.length} tenants`);

  // ============================================
  // 3. Create Users
  // ============================================
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const allUsers: any[] = [];

  for (let orgIndex = 0; orgIndex < organizations.length; orgIndex++) {
    const org = organizations[orgIndex];
    const orgUsers = USERS_PER_ORG[orgIndex];

    for (const userData of orgUsers) {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          organizationId: org.id,
        },
      });
      allUsers.push(user);
    }
  }
  console.log(`   ✓ Created ${allUsers.length} users`);

  // ============================================
  // 4. Create Admin Roles with RBAC Permissions
  // ============================================
  console.log('🔐 Creating admin roles with RBAC permissions...');
  const adminRoles: any[] = [];

  // 리소스 목록 정의
  const allResources = ['tenant', 'experiment', 'rule', 'integration', 'audit', 'user', 'campaign', 'security', 'budget', 'settings'];
  const allActions = ['create', 'read', 'update', 'delete', 'approve'];

  // 역할별 권한 정의
  const rolePermissions: Record<AdminRoleType, { resource: string; action: string; scope?: string }[]> = {
    // SUPER_ADMIN: 모든 리소스에 대한 전체 권한
    [AdminRoleType.SUPER_ADMIN]: allResources.flatMap(resource =>
      allActions.map(action => ({ resource, action, scope: '*' }))
    ),

    // ORG_ADMIN: 조직 내 대부분의 관리 권한 (audit approve 제외)
    [AdminRoleType.ORG_ADMIN]: [
      { resource: 'tenant', action: 'read' },
      { resource: 'tenant', action: 'update' },
      { resource: 'experiment', action: 'create' },
      { resource: 'experiment', action: 'read' },
      { resource: 'experiment', action: 'update' },
      { resource: 'experiment', action: 'delete' },
      { resource: 'experiment', action: 'approve' },
      { resource: 'rule', action: 'create' },
      { resource: 'rule', action: 'read' },
      { resource: 'rule', action: 'update' },
      { resource: 'rule', action: 'delete' },
      { resource: 'integration', action: 'create' },
      { resource: 'integration', action: 'read' },
      { resource: 'integration', action: 'update' },
      { resource: 'integration', action: 'delete' },
      { resource: 'user', action: 'create' },
      { resource: 'user', action: 'read' },
      { resource: 'user', action: 'update' },
      { resource: 'user', action: 'delete' },
      { resource: 'campaign', action: 'read' },
      { resource: 'campaign', action: 'update' },
      { resource: 'budget', action: 'read' },
      { resource: 'budget', action: 'update' },
      { resource: 'settings', action: 'read' },
      { resource: 'settings', action: 'update' },
      { resource: 'audit', action: 'read' },
    ],

    // DATA_OPS: 데이터 관련 권한
    [AdminRoleType.DATA_OPS]: [
      { resource: 'tenant', action: 'read' },
      { resource: 'experiment', action: 'read' },
      { resource: 'experiment', action: 'update' },
      { resource: 'rule', action: 'read' },
      { resource: 'integration', action: 'read' },
      { resource: 'integration', action: 'update' },
      { resource: 'campaign', action: 'read' },
      { resource: 'audit', action: 'read' },
      { resource: 'settings', action: 'read' },
    ],

    // AD_OPS: 광고 운영 관련 권한
    [AdminRoleType.AD_OPS]: [
      { resource: 'tenant', action: 'read' },
      { resource: 'experiment', action: 'read' },
      { resource: 'rule', action: 'create' },
      { resource: 'rule', action: 'read' },
      { resource: 'rule', action: 'update' },
      { resource: 'rule', action: 'delete' },
      { resource: 'campaign', action: 'create' },
      { resource: 'campaign', action: 'read' },
      { resource: 'campaign', action: 'update' },
      { resource: 'campaign', action: 'delete' },
      { resource: 'budget', action: 'read' },
      { resource: 'budget', action: 'update' },
      { resource: 'integration', action: 'read' },
      { resource: 'audit', action: 'read' },
    ],

    // PRODUCT_OWNER: 실험 및 제품 관련 권한
    [AdminRoleType.PRODUCT_OWNER]: [
      { resource: 'tenant', action: 'read' },
      { resource: 'experiment', action: 'create' },
      { resource: 'experiment', action: 'read' },
      { resource: 'experiment', action: 'update' },
      { resource: 'experiment', action: 'approve' },
      { resource: 'rule', action: 'read' },
      { resource: 'campaign', action: 'read' },
      { resource: 'integration', action: 'read' },
      { resource: 'audit', action: 'read' },
      { resource: 'settings', action: 'read' },
    ],

    // AUDITOR: 읽기 전용 감사 권한
    [AdminRoleType.AUDITOR]: allResources.map(resource => ({ resource, action: 'read' })),
  };

  // 역할별 할당할 사용자 매핑
  const roleUserMapping: { roleType: AdminRoleType; userIndex: number; description: string }[] = [
    { roleType: AdminRoleType.SUPER_ADMIN, userIndex: 0, description: '최고 관리자 - 전체 시스템 관리' },
    { roleType: AdminRoleType.ORG_ADMIN, userIndex: 1, description: '조직 관리자 - 조직 내 리소스 관리' },
    { roleType: AdminRoleType.DATA_OPS, userIndex: 2, description: '데이터 운영 - 데이터 파이프라인 관리' },
    { roleType: AdminRoleType.AD_OPS, userIndex: 5, description: '광고 운영 - 캠페인 및 예산 관리' },
    { roleType: AdminRoleType.PRODUCT_OWNER, userIndex: 6, description: '제품 담당자 - 실험 및 기능 관리' },
    { roleType: AdminRoleType.AUDITOR, userIndex: 3, description: '감사자 - 읽기 전용 접근' },
  ];

  for (const mapping of roleUserMapping) {
    const permissions = rolePermissions[mapping.roleType];
    
    const adminRole = await prisma.adminRole.create({
      data: {
        userId: allUsers[mapping.userIndex].id,
        roleType: mapping.roleType,
        grantedBy: mapping.roleType === AdminRoleType.SUPER_ADMIN ? 'SYSTEM' : allUsers[0].id,
        permissions: {
          create: permissions.map(perm => ({
            resource: perm.resource,
            action: perm.action,
            scope: perm.scope || null,
          })),
        },
      },
    });
    adminRoles.push(adminRole);
    console.log(`   ✓ ${mapping.roleType}: ${allUsers[mapping.userIndex].email} - ${mapping.description}`);
  }
  console.log(`   ✓ Created ${adminRoles.length} admin roles with detailed RBAC permissions`);

  // ============================================
  // 5. Create Experiments & Variations
  // ============================================
  console.log('🧪 Creating experiments...');
  const experiments: any[] = [];
  const variations: any[] = [];

  for (let i = 0; i < EXPERIMENTS.length; i++) {
    const exp = EXPERIMENTS[i];
    const experiment = await prisma.experiment.create({
      data: {
        name: exp.name,
        description: exp.description,
        status: exp.status,
        trafficAllocation: randomInt(50, 100),
      },
    });
    experiments.push(experiment);

    for (const varData of VARIATIONS_PER_EXPERIMENT[i]) {
      const variation = await prisma.variation.create({
        data: {
          experimentId: experiment.id,
          name: varData.name,
          key: varData.key,
          weight: varData.weight,
          config: { buttonColor: varData.key === 'control' ? 'blue' : 'red' },
        },
      });
      variations.push(variation);
    }
  }
  console.log(`   ✓ Created ${experiments.length} experiments with ${variations.length} variations`);

  // ============================================
  // 6. Create Assignments
  // ============================================
  console.log('📋 Creating assignments...');
  const assignments: any[] = [];

  for (const user of allUsers) {
    for (const experiment of experiments) {
      const expVariations = variations.filter((v) => v.experimentId === experiment.id);
      if (expVariations.length > 0) {
        const assignment = await prisma.assignment.create({
          data: {
            userId: user.id,
            experimentId: experiment.id,
            variationId: randomElement(expVariations).id,
            timestamp: randomPastDate(30),
          },
        });
        assignments.push(assignment);
      }
    }
  }
  console.log(`   ✓ Created ${assignments.length} assignments`);

  // ============================================
  // 7. Create Events
  // ============================================
  console.log('📊 Creating events...');
  const events: any[] = [];

  for (let i = 0; i < 100; i++) {
    const event = await prisma.event.create({
      data: {
        userId: randomElement(allUsers).id,
        eventName: randomElement(EVENT_NAMES),
        properties: {
          page: randomElement(['/home', '/product', '/cart', '/checkout']),
          value: randomInt(1000, 100000),
        },
        timestamp: randomPastDate(30),
      },
    });
    events.push(event);
  }
  console.log(`   ✓ Created ${events.length} events`);

  // ============================================
  // 8. Create Ad Accounts
  // ============================================
  console.log('📱 Creating ad accounts...');
  const adAccounts: any[] = [];
  const accountOrgMapping = [0, 0, 1, 1, 2, 2]; // Which org each account belongs to

  for (let i = 0; i < AD_ACCOUNTS.length; i++) {
    const acc = AD_ACCOUNTS[i];
    const adAccount = await prisma.adAccount.create({
      data: {
        platform: acc.platform,
        accountId: acc.accountId,
        name: acc.name,
        accessToken: `access_token_${acc.accountId}`,
        refreshToken: `refresh_token_${acc.accountId}`,
        tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        organizationId: organizations[accountOrgMapping[i]].id,
      },
    });
    adAccounts.push(adAccount);
  }
  console.log(`   ✓ Created ${adAccounts.length} ad accounts`);

  // ============================================
  // 9. Create Ad Campaigns, Groups, and Ads
  // ============================================
  console.log('🎯 Creating campaigns, ad groups, and ads...');
  const campaigns: any[] = [];
  const adGroups: any[] = [];
  const ads: any[] = [];

  for (let accIndex = 0; accIndex < adAccounts.length; accIndex++) {
    const account = adAccounts[accIndex];

    for (let campIndex = 0; campIndex < 3; campIndex++) {
      const campaign = await prisma.adCampaign.create({
        data: {
          adAccountId: account.id,
          externalId: `campaign_${account.id}_${campIndex}`,
          name: CAMPAIGNS_PER_ACCOUNT[accIndex][campIndex],
          status: randomElement(['ACTIVE', 'PAUSED', 'ACTIVE', 'ACTIVE']),
          budget: randomFloat(100000, 5000000),
          currency: 'KRW',
        },
      });
      campaigns.push(campaign);

      for (let groupIndex = 0; groupIndex < 2; groupIndex++) {
        const adGroup = await prisma.adGroup.create({
          data: {
            campaignId: campaign.id,
            externalId: `adgroup_${campaign.id}_${groupIndex}`,
            name: `${campaign.name} - 광고그룹 ${groupIndex + 1}`,
            status: randomElement(['ACTIVE', 'PAUSED', 'ACTIVE']),
          },
        });
        adGroups.push(adGroup);

        for (let adIndex = 0; adIndex < 2; adIndex++) {
          const ad = await prisma.ad.create({
            data: {
              adGroupId: adGroup.id,
              externalId: `ad_${adGroup.id}_${adIndex}`,
              name: `광고 소재 ${adIndex + 1}`,
              status: randomElement(['ACTIVE', 'PAUSED', 'ACTIVE']),
              creativeUrl: `https://cdn.example.com/creative_${adIndex}.jpg`,
              landingPageUrl: `https://www.example.com/landing/${adIndex}`,
            },
          });
          ads.push(ad);
        }
      }
    }
  }
  console.log(`   ✓ Created ${campaigns.length} campaigns, ${adGroups.length} ad groups, ${ads.length} ads`);

  // ============================================
  // 10. Create Ad Metrics (30 days of data)
  // ============================================
  console.log('📈 Creating ad metrics (30 days)...');
  const metrics: any[] = [];
  const dates = generateDateRange(30);

  for (const campaign of campaigns) {
    for (const date of dates) {
      const impressions = randomInt(1000, 50000);
      const ctr = randomFloat(0.01, 0.05);
      const clicks = Math.floor(impressions * ctr);
      const cpc = randomFloat(500, 2000);
      const spend = clicks * cpc;
      const conversionRate = randomFloat(0.01, 0.05);
      const conversions = Math.floor(clicks * conversionRate);
      const avgOrderValue = randomFloat(30000, 150000);
      const conversionValue = conversions * avgOrderValue;
      const roas = spend > 0 ? conversionValue / spend : 0;

      const metric = await prisma.adMetric.create({
        data: {
          campaignId: campaign.id,
          date: date,
          impressions,
          clicks,
          spend,
          conversions,
          conversionValue,
          roas: parseFloat(roas.toFixed(2)),
          ctr: parseFloat((ctr * 100).toFixed(2)),
          cpc: parseFloat(cpc.toFixed(2)),
          cpm: parseFloat(((spend / impressions) * 1000).toFixed(2)),
        },
      });
      metrics.push(metric);
    }
  }
  console.log(`   ✓ Created ${metrics.length} ad metrics`);

  // ============================================
  // 11. Create User Journeys & TouchPoints
  // ============================================
  console.log('🛤️ Creating user journeys and touchpoints...');
  const journeys: any[] = [];
  const touchpoints: any[] = [];
  const channels = ['google', 'meta', 'tiktok', 'organic', 'direct'];

  for (let i = 0; i < 30; i++) {
    const journey = await prisma.userJourney.create({
      data: {
        userId: randomElement(allUsers).id,
        sessionId: `session_${Date.now()}_${i}`,
        conversionValue: randomFloat(10000, 500000),
        convertedAt: randomPastDate(15),
        attributionModel: randomElement(['last_touch', 'first_touch', 'linear', 'time_decay']),
      },
    });
    journeys.push(journey);

    const numTouchpoints = randomInt(2, 5);
    for (let j = 0; j < numTouchpoints; j++) {
      const touchpoint = await prisma.touchPoint.create({
        data: {
          journeyId: journey.id,
          channel: randomElement(channels),
          source: randomElement(['google_search', 'facebook_feed', 'instagram_story', 'direct', 'organic']),
          medium: randomElement(['cpc', 'cpm', 'organic', 'referral']),
          campaign: randomElement(campaigns.map((c) => c.name)),
          order: j,
          attributionWeight: parseFloat((1 / numTouchpoints).toFixed(2)),
          timestamp: randomPastDate(20),
        },
      });
      touchpoints.push(touchpoint);
    }
  }
  console.log(`   ✓ Created ${journeys.length} journeys with ${touchpoints.length} touchpoints`);

  // ============================================
  // 12. Create Attribution Events
  // ============================================
  console.log('🎯 Creating attribution events...');
  const attributionEvents: any[] = [];

  for (let i = 0; i < 50; i++) {
    const event = await prisma.attributionEvent.create({
      data: {
        userId: randomElement(allUsers).id,
        source: randomElement(['google', 'facebook', 'tiktok', 'naver', 'kakao']),
        medium: randomElement(['cpc', 'cpm', 'organic', 'referral', 'email']),
        campaign: randomElement(campaigns.map((c) => c.name)),
        content: randomElement(['banner_a', 'banner_b', 'video_1', 'carousel_1']),
        term: randomElement(['마케팅 솔루션', '광고 플랫폼', '데이터 분석', null]),
        gclid: i % 3 === 0 ? `gclid_${Date.now()}_${i}` : null,
        fbp: i % 3 === 1 ? `fbp_${Date.now()}_${i}` : null,
        ttclid: i % 3 === 2 ? `ttclid_${Date.now()}_${i}` : null,
        timestamp: randomPastDate(30),
      },
    });
    attributionEvents.push(event);
  }
  console.log(`   ✓ Created ${attributionEvents.length} attribution events`);

  // ============================================
  // 13. Create Performance Predictions
  // ============================================
  console.log('🔮 Creating performance predictions...');
  const predictions: any[] = [];

  for (const campaign of campaigns.slice(0, 10)) {
    for (const predType of ['7day', '30day']) {
      const prediction = await prisma.performancePrediction.create({
        data: {
          campaignId: campaign.id,
          predictionType: predType,
          predictedROAS: randomFloat(1.5, 4),
          predictedSpend: randomFloat(500000, 5000000),
          predictedRevenue: randomFloat(1000000, 10000000),
          predictedConversions: randomInt(50, 500),
          predictedCTR: randomFloat(1, 5),
          predictedCPC: randomFloat(500, 2000),
          confidenceScore: randomFloat(0.6, 0.95),
          modelVersion: 'v1.2.0',
        },
      });
      predictions.push(prediction);
    }
  }
  console.log(`   ✓ Created ${predictions.length} performance predictions`);

  // ============================================
  // 14. Create Anomaly Alerts
  // ============================================
  console.log('⚠️ Creating anomaly alerts...');
  const anomalyAlerts: any[] = [];
  const metricTypes = ['ctr', 'roas', 'conversion_rate', 'spend', 'cpc'];
  const alertTypes = ['spike', 'drop', 'threshold_breach'];
  const severities = ['low', 'medium', 'high', 'critical'];

  for (let i = 0; i < 10; i++) {
    const alert = await prisma.anomalyAlert.create({
      data: {
        campaignId: randomElement(campaigns).id,
        metricType: randomElement(metricTypes),
        alertType: randomElement(alertTypes),
        currentValue: randomFloat(0, 100),
        expectedValue: randomFloat(0, 100),
        threshold: randomFloat(10, 50),
        deviation: randomFloat(-3, 3),
        severity: randomElement(severities),
        message: `${randomElement(metricTypes)} 지표에서 이상 패턴이 감지되었습니다.`,
        isResolved: i < 5,
        resolvedAt: i < 5 ? randomPastDate(5) : null,
        createdAt: randomPastDate(15),
      },
    });
    anomalyAlerts.push(alert);
  }
  console.log(`   ✓ Created ${anomalyAlerts.length} anomaly alerts`);

  // ============================================
  // 15. Create Optimization Rules
  // ============================================
  console.log('⚙️ Creating optimization rules...');
  const optimizationRules: any[] = [];

  for (const rule of OPTIMIZATION_RULES) {
    const optRule = await prisma.optimizationRule.create({
      data: {
        name: rule.name,
        description: rule.description,
        ruleType: rule.ruleType,
        conditions: rule.conditions,
        actions: rule.actions,
        priority: randomInt(1, 10),
        triggerCount: randomInt(0, 50),
        lastTriggeredAt: randomPastDate(7),
      },
    });
    optimizationRules.push(optRule);
  }
  console.log(`   ✓ Created ${optimizationRules.length} optimization rules`);

  // ============================================
  // 16. Create Budget Allocations
  // ============================================
  console.log('💰 Creating budget allocations...');
  const budgetAllocations: any[] = [];

  for (const campaign of campaigns.slice(0, 10)) {
    const adAccount = adAccounts.find((a) => campaigns.some((c) => c.adAccountId === a.id && c.id === campaign.id));
    const allocation = await prisma.budgetAllocation.create({
      data: {
        adAccountId: adAccount?.id || adAccounts[0].id,
        campaignId: campaign.id,
        period: randomElement(['daily', 'weekly', 'monthly']),
        targetROAS: randomFloat(2, 4),
        targetCPA: randomFloat(5000, 20000),
        currentBudget: randomFloat(100000, 1000000),
        recommendedBudget: randomFloat(100000, 1200000),
        minBudget: 50000,
        maxBudget: 2000000,
        allocationScore: randomFloat(0.5, 1),
      },
    });
    budgetAllocations.push(allocation);
  }
  console.log(`   ✓ Created ${budgetAllocations.length} budget allocations`);

  // ============================================
  // 17. Create Notification Logs
  // ============================================
  console.log('🔔 Creating notification logs...');
  const notificationLogs: any[] = [];
  const notificationTypes = [NotificationType.ROAS_DROP, NotificationType.CONVERSION_DROP, NotificationType.BUDGET_DEPLETED, NotificationType.ANOMALY_DETECTED, NotificationType.OPTIMIZATION_APPLIED];

  for (let i = 0; i < 20; i++) {
    const notifType = randomElement(notificationTypes);
    const log = await prisma.notificationLog.create({
      data: {
        userId: randomElement(allUsers).id,
        notificationType: notifType,
        channel: randomElement([NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.IN_APP]),
        title: `${notifType} 알림`,
        message: `${randomElement(campaigns).name} 캠페인에서 ${notifType} 이벤트가 발생했습니다.`,
        metadata: { campaignId: randomElement(campaigns).id, value: randomFloat(0, 100) },
        isRead: i < 10,
        sentAt: randomPastDate(15),
      },
    });
    notificationLogs.push(log);
  }
  console.log(`   ✓ Created ${notificationLogs.length} notification logs`);

  // ============================================
  // 18. Create Audit Logs
  // ============================================
  console.log('📝 Creating audit logs...');
  const auditLogs: any[] = [];
  const actions = ['create', 'update', 'delete', 'approve', 'reject'];
  const resources = ['experiment', 'rule', 'integration', 'user', 'campaign'];

  for (let i = 0; i < 50; i++) {
    const user = randomElement(allUsers);
    const log = await prisma.auditLog.create({
      data: {
        tenantId: randomElement(tenants).id,
        userId: user.id,
        userEmail: user.email,
        action: randomElement(actions),
        resource: randomElement(resources),
        resourceId: `resource_${i}`,
        oldValue: i % 3 === 0 ? { status: 'draft' } : undefined,
        newValue: { status: 'active' },
        ipAddress: `192.168.1.${randomInt(1, 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: randomPastDate(30),
      },
    });
    auditLogs.push(log);
  }
  console.log(`   ✓ Created ${auditLogs.length} audit logs`);

  // ============================================
  // 19. Create Integration Statuses
  // ============================================
  console.log('🔗 Creating integration statuses...');
  const integrationStatuses: any[] = [];
  const integrationPlatforms = [IntegrationPlatform.GOOGLE, IntegrationPlatform.META, IntegrationPlatform.TIKTOK, IntegrationPlatform.NAVER, IntegrationPlatform.KAKAO];

  for (const tenant of tenants) {
    for (const platform of integrationPlatforms.slice(0, 3)) {
      const status = await prisma.integrationStatus.create({
        data: {
          tenantId: tenant.id,
          platform,
          accountId: `${platform.toLowerCase()}_account_${tenant.id.slice(0, 8)}`,
          tokenStatus: randomElement(['valid', 'valid', 'valid', 'expiring']),
          tokenExpiresAt: new Date(Date.now() + randomInt(1, 60) * 24 * 60 * 60 * 1000),
          lastSyncAt: randomPastDate(1),
          lastSuccessAt: randomPastDate(1),
          permissionScope: ['read_ads', 'manage_campaigns', 'read_insights'],
          rateLimitRemaining: randomInt(100, 1000),
          apiErrorRate: randomFloat(0, 0.05),
        },
      });
      integrationStatuses.push(status);
    }
  }
  console.log(`   ✓ Created ${integrationStatuses.length} integration statuses`);

  // ============================================
  // 20. Create Seasonal Profiles
  // ============================================
  console.log('📅 Creating seasonal profiles...');
  const seasonalProfiles: any[] = [];

  for (const profile of SEASONAL_PROFILES) {
    const sp = await prisma.seasonalProfile.create({
      data: profile,
    });
    seasonalProfiles.push(sp);
  }
  console.log(`   ✓ Created ${seasonalProfiles.length} seasonal profiles`);

  // ============================================
  // 21. Create Security Alerts
  // ============================================
  console.log('🛡️ Creating security alerts...');
  const securityAlerts: any[] = [];
  const alertSources = ['auth_service', 'api_gateway', 'data_pipeline', 'user_activity'];

  for (let i = 0; i < 8; i++) {
    const alert = await prisma.securityAlert.create({
      data: {
        alertType: randomElement(['abnormal_access', 'token_expired', 'pii_detected', 'rate_limit_exceeded']),
        severity: randomElement(severities),
        source: randomElement(alertSources),
        description: `보안 이벤트가 감지되었습니다. 확인이 필요합니다.`,
        metadata: { userId: randomElement(allUsers).id, ip: `192.168.1.${randomInt(1, 255)}` },
        isResolved: i < 4,
        resolvedAt: i < 4 ? randomPastDate(3) : null,
        resolvedBy: i < 4 ? randomElement(allUsers).id : null,
        createdAt: randomPastDate(10),
      },
    });
    securityAlerts.push(alert);
  }
  console.log(`   ✓ Created ${securityAlerts.length} security alerts`);

  // ============================================
  // 22. Create Cost Quotas
  // ============================================
  console.log('💳 Creating cost quotas...');
  const costQuotas: any[] = [];
  const quotaTypes = ['events', 'storage', 'query', 'api_calls'];

  for (const tenant of tenants) {
    for (const quotaType of quotaTypes) {
      const limitValue = quotaType === 'events' ? 1000000 : quotaType === 'storage' ? 10000000000 : 100000;
      const quota = await prisma.costQuota.create({
        data: {
          tenantId: tenant.id,
          quotaType,
          limitValue: BigInt(limitValue),
          currentValue: BigInt(randomInt(0, Math.floor(limitValue * 0.8))),
          alertThreshold: 0.8,
          period: 'monthly',
        },
      });
      costQuotas.push(quota);
    }
  }
  console.log(`   ✓ Created ${costQuotas.length} cost quotas`);

  // ============================================
  // 23. Create Schema Registries
  // ============================================
  console.log('📋 Creating schema registries...');
  const schemaRegistries: any[] = [];

  for (const tenant of tenants) {
    for (const eventName of EVENT_NAMES.slice(0, 4)) {
      const registry = await prisma.schemaRegistry.create({
        data: {
          tenantId: tenant.id,
          eventName,
          version: 1,
          schema: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              value: { type: 'number' },
            },
            required: ['userId', 'timestamp'],
          },
          isRequired: eventName === 'purchase',
        },
      });
      schemaRegistries.push(registry);
    }
  }
  console.log(`   ✓ Created ${schemaRegistries.length} schema registries`);

  // ============================================
  // 24. Create ETL Jobs
  // ============================================
  console.log('🔄 Creating ETL jobs...');
  const etlJobs: any[] = [];
  const jobTypes = ['sync', 'backfill', 'replay'];
  const jobStatuses = ['pending', 'running', 'completed', 'failed'];

  for (const tenant of tenants) {
    for (let i = 0; i < 3; i++) {
      const job = await prisma.etlJob.create({
        data: {
          tenantId: tenant.id,
          jobType: randomElement(jobTypes),
          platform: randomElement(['google', 'meta', 'tiktok']),
          status: randomElement(jobStatuses),
          config: { batchSize: 1000, retryCount: 3 },
          startAt: randomPastDate(5),
          endAt: i < 2 ? randomPastDate(4) : null,
          processedCount: randomInt(0, 50000),
          errorMessage: i === 2 ? 'Rate limit exceeded' : null,
        },
      });
      etlJobs.push(job);
    }
  }
  console.log(`   ✓ Created ${etlJobs.length} ETL jobs`);

  // ============================================
  // 25. Create AI Model Settings
  // ============================================
  console.log('🤖 Creating AI model settings...');
  const aiModelConfigs = await Promise.all([
    prisma.aIModelConfig.create({
      data: { modelType: 'prediction', modelVersion: 'v1.2.0', provider: 'custom', isActive: true, config: { batchSize: 1000, epochs: 100 } }
    }),
    prisma.aIModelConfig.create({
      data: { modelType: 'copywriting', modelVersion: 'gpt-4-turbo', provider: 'openai', isActive: true, config: { maxTokens: 2000, temperature: 0.7 } }
    }),
    prisma.aIModelConfig.create({
      data: { modelType: 'image_generation', modelVersion: 'dall-e-3', provider: 'openai', isActive: false, config: { size: '1024x1024', quality: 'hd' } }
    }),
  ]);
  await Promise.all([
    prisma.aIModelSafety.create({ data: { ruleType: 'forbidden_word', ruleValue: '무료', isActive: true, priority: 1 } }),
    prisma.aIModelSafety.create({ data: { ruleType: 'forbidden_word', ruleValue: '최저가', isActive: true, priority: 2 } }),
    prisma.aIModelSafety.create({ data: { ruleType: 'brand_guideline', ruleValue: '항상 브랜드명 포함', isActive: true, priority: 3 } }),
  ]);
  console.log(`   ✓ Created ${aiModelConfigs.length} AI model configs`);

  // ============================================
  // 26. Create Ad Platform Settings
  // ============================================
  console.log('📱 Creating ad platform settings...');
  const platformConfigs = await Promise.all([
    prisma.platformConfig.create({ data: { platform: 'GOOGLE', authConfig: { clientId: 'xxx', clientSecret: 'yyy' }, tokenAutoRefresh: true, refreshInterval: 3600, isActive: true } }),
    prisma.platformConfig.create({ data: { platform: 'META', authConfig: { appId: 'xxx', appSecret: 'yyy' }, tokenAutoRefresh: true, refreshInterval: 7200, isActive: true } }),
    prisma.platformConfig.create({ data: { platform: 'TIKTOK', authConfig: { clientKey: 'xxx', clientSecret: 'yyy' }, tokenAutoRefresh: false, refreshInterval: 3600, isActive: false } }),
  ]);
  await Promise.all([
    prisma.budgetConfig.create({ data: { budgetType: 'daily', defaultAmount: 500000, currency: 'KRW', autoStopEnabled: true, autoStopKpi: 'roas', autoStopThreshold: 1.0 } }),
    prisma.budgetConfig.create({ data: { budgetType: 'weekly', defaultAmount: 3000000, currency: 'KRW', autoStopEnabled: true, autoStopKpi: 'cpa', autoStopThreshold: 50000 } }),
    prisma.budgetConfig.create({ data: { budgetType: 'monthly', defaultAmount: 10000000, currency: 'KRW', autoStopEnabled: false } }),
  ]);
  console.log(`   ✓ Created ${platformConfigs.length} platform configs`);

  // ============================================
  // 27. Create Conversion Settings
  // ============================================
  console.log('🎯 Creating conversion settings...');
  const conversionRules = await Promise.all([
    prisma.conversionRule.create({ data: { name: '구매 전환', eventType: 'purchase', conversionValue: 100000, lookbackWindow: 30, isActive: true } }),
    prisma.conversionRule.create({ data: { name: '장바구니 전환', eventType: 'add_to_cart', conversionValue: 10000, lookbackWindow: 7, isActive: true } }),
    prisma.conversionRule.create({ data: { name: '회원가입 전환', eventType: 'signup', conversionValue: 50000, lookbackWindow: 30, isActive: true } }),
  ]);
  const attributionModels = await Promise.all([
    prisma.attributionModelConfig.create({ data: { modelType: 'last_touch', isDefault: true, config: {} } }),
    prisma.attributionModelConfig.create({ data: { modelType: 'linear', isDefault: false, config: {} } }),
    prisma.attributionModelConfig.create({ data: { modelType: 'data_driven', isDefault: false, config: { algorithm: 'shapley' } } }),
  ]);
  await Promise.all([
    prisma.funnelWeight.create({ data: { funnelStep: 'awareness', weight: 0.2, autoOptimize: true } }),
    prisma.funnelWeight.create({ data: { funnelStep: 'consideration', weight: 0.3, autoOptimize: true } }),
    prisma.funnelWeight.create({ data: { funnelStep: 'conversion', weight: 0.5, autoOptimize: false } }),
  ]);
  console.log(`   ✓ Created ${conversionRules.length} conversion rules, ${attributionModels.length} attribution models`);

  // ============================================
  // 28. Create Experiment Settings
  // ============================================
  console.log('🧪 Creating experiment settings...');
  const expTemplates = await Promise.all([
    prisma.experimentTemplate.create({ data: { name: '광고 A/B 테스트', templateType: 'ad', defaultConfig: { duration: 14, minSample: 1000 }, isActive: true } }),
    prisma.experimentTemplate.create({ data: { name: '랜딩페이지 테스트', templateType: 'landing', defaultConfig: { duration: 7, minSample: 500 }, isActive: true } }),
  ]);
  await prisma.experimentAutoConfig.create({ data: { winnerKpi: 'conversion_rate', minSampleSize: 1000, autoApply: true, autoRollback: true, rollbackThreshold: 0.1 } });
  await prisma.statisticalConfig.create({ data: { confidenceLevel: 0.95, method: 'frequentist', priorConfig: {} } });
  console.log(`   ✓ Created ${expTemplates.length} experiment templates`);

  // ============================================
  // 29. Create Segment Settings
  // ============================================
  console.log('👥 Creating segment settings...');
  const segmentRules = await Promise.all([
    prisma.segmentRule.create({ data: { name: '고가치 고객', ruleType: 'value', conditions: { ltv: { gte: 1000000 } }, autoGenerate: true, isActive: true } }),
    prisma.segmentRule.create({ data: { name: '최근 구매자', ruleType: 'behavior', conditions: { lastPurchase: { daysAgo: 30 } }, autoGenerate: true, isActive: true } }),
    prisma.segmentRule.create({ data: { name: '휴면 고객', ruleType: 'time', conditions: { lastVisit: { daysAgo: 90 } }, autoGenerate: false, isActive: true } }),
  ]);
  await Promise.all([
    prisma.audienceSync.create({ data: { platform: 'GOOGLE', audienceId: 'google_aud_123', syncEnabled: true, syncFrequency: 'daily' } }),
    prisma.audienceSync.create({ data: { platform: 'META', audienceId: 'meta_aud_456', syncEnabled: true, syncFrequency: 'hourly' } }),
  ]);
  console.log(`   ✓ Created ${segmentRules.length} segment rules`);

  // ============================================
  // 30. Create ETL Settings
  // ============================================
  console.log('⚙️ Creating ETL settings...');
  const etlSchedules = await Promise.all([
    prisma.etlSchedule.create({ data: { jobName: '광고 데이터 동기화', scheduleType: 'batch', cronExpression: '0 */6 * * *', retentionDays: 90, isActive: true } }),
    prisma.etlSchedule.create({ data: { jobName: '이벤트 스트림 처리', scheduleType: 'stream', retentionDays: 7, isActive: true } }),
  ]);
  await Promise.all([
    prisma.dataQualityRule.create({ data: { ruleName: '클릭ID 매칭률', metricType: 'click_id_match_rate', threshold: 0.9, alertEnabled: true } }),
    prisma.dataQualityRule.create({ data: { ruleName: '이벤트 누락률', metricType: 'event_loss_rate', threshold: 0.05, alertEnabled: true } }),
  ]);
  await Promise.all([
    prisma.storagePolicy.create({ data: { tableName: 'events', partitionBy: 'date', retentionYears: 3, compressAfterDays: 30, isActive: true } }),
    prisma.storagePolicy.create({ data: { tableName: 'ad_metrics', partitionBy: 'month', retentionYears: 5, compressAfterDays: 60, isActive: true } }),
  ]);
  console.log(`   ✓ Created ${etlSchedules.length} ETL schedules`);

  // ============================================
  // 31. Create Report Settings
  // ============================================
  console.log('📊 Creating report settings...');
  const kpiDefs = await Promise.all([
    prisma.kpiDefinition.create({ data: { name: 'ROAS', kpiType: 'roas', formula: 'revenue / spend', defaultValue: 2.0 } }),
    prisma.kpiDefinition.create({ data: { name: 'CAC', kpiType: 'cac', formula: 'spend / new_customers', defaultValue: 50000 } }),
    prisma.kpiDefinition.create({ data: { name: 'LTV', kpiType: 'ltv', formula: 'avg_order_value * purchase_frequency * lifespan', defaultValue: 500000 } }),
  ]);
  await Promise.all([
    prisma.dashboardTemplate.create({ data: { name: '기본 대시보드', layout: { widgets: ['roas', 'spend', 'conversions'] }, isDefault: true, colorScheme: 'light' } }),
    prisma.dashboardTemplate.create({ data: { name: '실시간 대시보드', layout: { widgets: ['realtime_events', 'live_spend'] }, isDefault: false, colorScheme: 'dark' } }),
  ]);
  await Promise.all([
    prisma.reportSchedule.create({ data: { reportName: '일간 성과 리포트', frequency: 'daily', format: 'pdf', recipients: ['admin@company.kr'], isActive: true } }),
    prisma.reportSchedule.create({ data: { reportName: '주간 요약 리포트', frequency: 'weekly', format: 'excel', recipients: ['team@company.kr'], isActive: true } }),
  ]);
  console.log(`   ✓ Created ${kpiDefs.length} KPI definitions`);

  // ============================================
  // 32. Create Alert Settings
  // ============================================
  console.log('🔔 Creating alert settings...');
  const alertRules = await Promise.all([
    prisma.alertRule.create({ data: { name: '예산 소진 알림', alertType: 'budget_depleted', conditions: { spendRatio: { gte: 0.9 } }, threshold: 90, isActive: true } }),
    prisma.alertRule.create({ data: { name: '전환 급감 알림', alertType: 'conversion_drop', conditions: { dropRate: { gte: 0.3 } }, threshold: 30, isActive: true } }),
    prisma.alertRule.create({ data: { name: '트래킹 누락 알림', alertType: 'tracking_loss', conditions: { lossRate: { gte: 0.1 } }, threshold: 10, isActive: true } }),
  ]);
  await Promise.all([
    prisma.automationRule.create({ data: { name: '저성과 캠페인 중지', ruleType: 'campaign_pause', triggerConditions: { roas: { lt: 0.5 } }, actions: { action: 'pause' }, isActive: true } }),
    prisma.automationRule.create({ data: { name: '고성과 예산 증가', ruleType: 'budget_increase', triggerConditions: { roas: { gte: 3 } }, actions: { action: 'increase', percentage: 20 }, isActive: true } }),
  ]);
  console.log(`   ✓ Created ${alertRules.length} alert rules`);

  // ============================================
  // 33. Create Security Settings
  // ============================================
  console.log('🔐 Creating security settings...');
  const accessPolicies = await Promise.all([
    prisma.accessPolicy.create({ data: { policyType: 'ip_whitelist', ipRange: '192.168.0.0/16', description: '사내 네트워크', isActive: true } }),
    prisma.accessPolicy.create({ data: { policyType: 'ip_whitelist', ipRange: '10.0.0.0/8', description: 'VPN 네트워크', isActive: true } }),
    prisma.accessPolicy.create({ data: { policyType: 'ip_blacklist', ipRange: '0.0.0.0/0', description: '기본 차단', isActive: false } }),
  ]);
  await Promise.all([
    prisma.apiKeyConfig.create({ data: { keyName: '프로덕션 API 키', apiKey: `prod-api-key-${Date.now()}-${Math.random().toString(36).slice(2)}`, permissions: ['read', 'write'], isActive: true } }),
    prisma.apiKeyConfig.create({ data: { keyName: '테스트 API 키', apiKey: `test-api-key-${Date.now()}-${Math.random().toString(36).slice(2)}`, permissions: ['read'], isActive: true } }),
  ]);
  console.log(`   ✓ Created ${accessPolicies.length} access policies`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Database seeding completed successfully!\n');
  console.log('Summary:');
  console.log(`  - Organizations: ${organizations.length}`);
  console.log(`  - Tenants: ${tenants.length}`);
  console.log(`  - Users: ${allUsers.length}`);
  console.log(`  - Admin Roles: ${adminRoles.length}`);
  console.log(`  - Experiments: ${experiments.length}`);
  console.log(`  - Variations: ${variations.length}`);
  console.log(`  - Assignments: ${assignments.length}`);
  console.log(`  - Events: ${events.length}`);
  console.log(`  - Ad Accounts: ${adAccounts.length}`);
  console.log(`  - Ad Campaigns: ${campaigns.length}`);
  console.log(`  - Ad Groups: ${adGroups.length}`);
  console.log(`  - Ads: ${ads.length}`);
  console.log(`  - Ad Metrics: ${metrics.length}`);
  console.log(`  - User Journeys: ${journeys.length}`);
  console.log(`  - TouchPoints: ${touchpoints.length}`);
  console.log(`  - Attribution Events: ${attributionEvents.length}`);
  console.log(`  - Performance Predictions: ${predictions.length}`);
  console.log(`  - Anomaly Alerts: ${anomalyAlerts.length}`);
  console.log(`  - Optimization Rules: ${optimizationRules.length}`);
  console.log(`  - Budget Allocations: ${budgetAllocations.length}`);
  console.log(`  - Notification Logs: ${notificationLogs.length}`);
  console.log(`  - Audit Logs: ${auditLogs.length}`);
  console.log(`  - Integration Statuses: ${integrationStatuses.length}`);
  console.log(`  - Seasonal Profiles: ${seasonalProfiles.length}`);
  console.log(`  - Security Alerts: ${securityAlerts.length}`);
  console.log(`  - Cost Quotas: ${costQuotas.length}`);
  console.log(`  - Schema Registries: ${schemaRegistries.length}`);
  console.log(`  - ETL Jobs: ${etlJobs.length}`);
  console.log(`  - AI Model Configs: ${aiModelConfigs.length}`);
  console.log(`  - Platform Configs: ${platformConfigs.length}`);
  console.log(`  - Conversion Rules: ${conversionRules.length}`);
  console.log(`  - Attribution Models: ${attributionModels.length}`);
  console.log(`  - Experiment Templates: ${expTemplates.length}`);
  console.log(`  - Segment Rules: ${segmentRules.length}`);
  console.log(`  - ETL Schedules: ${etlSchedules.length}`);
  console.log(`  - KPI Definitions: ${kpiDefs.length}`);
  console.log(`  - Alert Rules: ${alertRules.length}`);
  console.log(`  - Access Policies: ${accessPolicies.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

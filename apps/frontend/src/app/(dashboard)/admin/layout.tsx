'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const adminNavItems = [
  {
    title: '📊 Dashboard',
    icon: '📊',
    items: [
      { name: '실시간 성과', href: '/admin', icon: '📈' },
      { name: 'KPI 리포트', href: '/admin/reports', icon: '📑' },
      { name: '대시보드 템플릿', href: '/admin/dashboard-templates', icon: '🎨' },
    ]
  },
  {
    title: '🎯 Optimization Center',
    icon: '🎯',
    items: [
      { name: '캠페인 관리', href: '/admin/campaigns', icon: '📢' },
      { name: '예산 최적화', href: '/admin/budget-optimizer', icon: '💰' },
      { name: '자동화 규칙', href: '/admin/rules', icon: '⚙️' },
      { name: '실험(A/B 테스트)', href: '/admin/experiments', icon: '🧪' },
    ]
  },
  {
    title: '📈 Measurement Center',
    icon: '📈',
    items: [
      { name: '전환 추적', href: '/admin/conversions', icon: '🎯' },
      { name: '어트리뷰션 설정', href: '/admin/attribution', icon: '🔀' },
      { name: 'UTM 관리', href: '/admin/utm', icon: '🔗' },
      { name: '세그먼트/오디언스', href: '/admin/segments', icon: '👥' },
    ]
  },
  {
    title: '🤖 AI Intelligence',
    icon: '🤖',
    items: [
      { name: 'AI 모델 설정', href: '/admin/ai/models', icon: '🧠' },
      { name: '소재 자동 생성', href: '/admin/ai/creative', icon: '✨' },
      { name: '성과 예측', href: '/admin/ai/predictions', icon: '🔮' },
      { name: '모델 검증', href: '/admin/ai/validation', icon: '✅' },
    ]
  },
  {
    title: '🔍 Data Quality Hub',
    icon: '🔍',
    items: [
      { name: '이벤트 품질', href: '/admin/data-quality/events', icon: '📊' },
      { name: '광고 데이터 품질', href: '/admin/data-quality/ads', icon: '📉' },
      { name: 'ETL 파이프라인', href: '/admin/data-quality/etl', icon: '🔄' },
      { name: '알림 & 규칙', href: '/admin/data-quality/alerts', icon: '🔔' },
    ]
  },
  {
    title: '🔐 Security & Access',
    icon: '🔐',
    items: [
      { name: '권한 관리', href: '/admin/security/roles', icon: '👤' },
      { name: 'API 인증', href: '/admin/security/api-keys', icon: '🔑' },
      { name: '감사 로그', href: '/admin/security/audit', icon: '📝' },
      { name: '플랫폼 연동', href: '/admin/security/integrations', icon: '🔗' },
      { name: '테넌트 관리', href: '/admin/security/tenants', icon: '🏢' },
    ]
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside 
        className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col border-r border-slate-700`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
              J
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  jaGrow Admin
                </h1>
                <p className="text-xs text-slate-400">Enterprise Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {adminNavItems.map((section) => (
            <div key={section.title} className="mb-6">
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-500'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {!sidebarCollapsed && (
                          <span className="text-sm font-medium">{item.name}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? '→' : '←'}
            {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-slate-800/50 backdrop-blur-xl border-b border-slate-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {adminNavItems.flatMap(s => s.items).find(i => i.href === pathname)?.name || 'Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              🔔
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                {user.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">{user.email}</p>
                <p className="text-slate-400 text-xs">{user.role || 'Admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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

        {/* Dashboard Link */}
        <div className="p-4 border-b border-slate-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600/20 transition-all duration-200"
          >
            <span className="text-lg">🏠</span>
            {!sidebarCollapsed && <span className="text-sm font-medium">사용자 대시보드로 이동</span>}
          </Link>
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
        <header className="h-16 bg-slate-800/50 backdrop-blur-xl border-b border-slate-700 flex items-center justify-between px-6 relative z-50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {adminNavItems.flatMap(s => s.items).find(i => i.href === pathname)?.name || 'Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Dashboard Quick Link */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span>🏠</span>
              <span>대시보드</span>
            </Link>

            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors relative">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                  {user.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-sm text-left">
                  <p className="text-white font-medium">{user.name || user.email}</p>
                  <p className="text-slate-400 text-xs">{user.role || 'Admin'}</p>
                </div>
                <span className="text-slate-400 text-xs">{profileDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[9999] overflow-hidden">
                  {/* User Info Header */}
                  <div className="p-4 bg-slate-700/50 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-lg font-bold text-white">
                        {user.email?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name || 'Admin User'}</p>
                        <p className="text-slate-400 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <span>🏠</span>
                      <span>사용자 대시보드</span>
                    </Link>
                    <Link
                      href="/settings/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <span>👤</span>
                      <span>프로필 설정</span>
                    </Link>
                    <Link
                      href="/settings/notifications"
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <span>🔔</span>
                      <span>알림 설정</span>
                    </Link>
                    <Link
                      href="/settings/security"
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <span>🔒</span>
                      <span>보안 설정</span>
                    </Link>
                    <Link
                      href="/help"
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <span>❓</span>
                      <span>도움말</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-700 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <span>🚪</span>
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              )}
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

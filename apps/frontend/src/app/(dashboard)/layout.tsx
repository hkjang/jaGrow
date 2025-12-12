'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const menuItems = [
  { name: 'Overview', href: '/dashboard', icon: '📊' },
  { name: 'Experiments', href: '/dashboard/experiments', icon: '🧪' },
  { name: 'Ads Management', href: '/dashboard/ads', icon: '📢' },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: '📈' },
  { name: 'UTM Generator', href: '/dashboard/utm', icon: '🔗' },
  { name: 'Attribution', href: '/dashboard/attribution', icon: '🎯' },
  { name: 'AI Copywriter', href: '/dashboard/ai-copy', icon: '✨' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  // Admin 경로인 경우 Admin 레이아웃이 자체 사이드바를 가지므로 children만 반환
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col border-r border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">🌱 jaGrow</h2>
          <p className="text-xs text-slate-400 mt-1">Marketing Growth Platform</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
            Main Features
          </h3>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Admin Panel 링크 */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
              Administration
            </h3>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <span className="text-lg">⚙️</span>
              Admin Panel
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">Logged in</div>
          <button
            onClick={logout}
            className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
      
      <main className="flex-1 p-6 overflow-y-auto bg-slate-900">
        {children}
      </main>
    </div>
  );
}

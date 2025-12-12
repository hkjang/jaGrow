'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  activeExperiments: number;
  totalUsers: number;
  eventsToday: number;
  conversionsToday: number;
  adSpendThisMonth: number;
  avgRoas: number;
  activeCampaigns: number;
  alertCount: number;
}

const API_URL = 'http://localhost:4000';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeExperiments: 0,
    totalUsers: 0,
    eventsToday: 0,
    conversionsToday: 0,
    adSpendThisMonth: 0,
    avgRoas: 0,
    activeCampaigns: 0,
    alertCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<{ action: string; time: string; type: string }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        loadMockData();
      }
    } catch (error) {
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setStats({
      activeExperiments: 4,
      totalUsers: 1234,
      eventsToday: 45200,
      conversionsToday: 287,
      adSpendThisMonth: 6000000,
      avgRoas: 3.2,
      activeCampaigns: 12,
      alertCount: 3
    });

    setRecentActivity([
      { action: 'New checkout flow experiment started', time: '10분 전', type: 'experiment' },
      { action: 'Google Ads 토큰 갱신됨', time: '25분 전', type: 'integration' },
      { action: '브랜드 인지도 캠페인 예산 증가', time: '1시간 전', type: 'campaign' },
      { action: '새 사용자 가입: user@example.com', time: '2시간 전', type: 'user' },
      { action: 'High CTR rule 트리거됨', time: '3시간 전', type: 'rule' },
    ]);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back! Here's your marketing overview.</p>
        </div>
        <div className="text-sm text-slate-400">
          Last updated: just now
        </div>
      </div>

      {/* Alert Banner */}
      {stats.alertCount > 0 && (
        <Link href="/admin/security" className="block">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/30 flex items-center justify-between hover:border-orange-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="text-white font-medium">{stats.alertCount} 개의 보안 알림이 있습니다</p>
                <p className="text-slate-400 text-sm">클릭하여 확인</p>
              </div>
            </div>
            <span className="text-orange-400">→</span>
          </div>
        </Link>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🧪"
          label="Active Experiments"
          value={stats.activeExperiments}
          color="purple"
          href="/dashboard/experiments"
        />
        <StatCard
          icon="📊"
          label="Events Today"
          value={formatNumber(stats.eventsToday)}
          color="blue"
        />
        <StatCard
          icon="💰"
          label="Ad Spend (MTD)"
          value={formatCurrency(stats.adSpendThisMonth)}
          color="green"
          href="/dashboard/ads"
        />
        <StatCard
          icon="📈"
          label="Avg ROAS"
          value={`${stats.avgRoas.toFixed(1)}x`}
          color="yellow"
          href="/dashboard/campaigns"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🎯"
          label="Conversions Today"
          value={stats.conversionsToday}
          color="green"
          href="/dashboard/attribution"
        />
        <StatCard
          icon="📢"
          label="Active Campaigns"
          value={stats.activeCampaigns}
          color="blue"
          href="/dashboard/campaigns"
        />
        <StatCard
          icon="👥"
          label="Total Users"
          value={formatNumber(stats.totalUsers)}
          color="purple"
        />
        <StatCard
          icon="⚠️"
          label="Alerts"
          value={stats.alertCount}
          color={stats.alertCount > 0 ? "red" : "green"}
          href="/admin/security"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon="🧪" label="New Experiment" href="/admin/experiments" />
            <QuickAction icon="🔗" label="UTM Generator" href="/dashboard/utm" />
            <QuickAction icon="✨" label="AI Copywriter" href="/dashboard/ai-copy" />
            <QuickAction icon="📊" label="Attribution" href="/dashboard/attribution" />
            <QuickAction icon="📢" label="Campaigns" href="/dashboard/campaigns" />
            <QuickAction icon="⚙️" label="Rules" href="/admin/rules" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'experiment' ? 'bg-purple-400' :
                  activity.type === 'integration' ? 'bg-blue-400' :
                  activity.type === 'campaign' ? 'bg-green-400' :
                  activity.type === 'rule' ? 'bg-yellow-400' : 'bg-slate-400'
                }`} />
                <span className="text-slate-300 flex-1">{activity.action}</span>
                <span className="text-slate-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <span className="text-4xl mb-2 block">📈</span>
            <p>실시간 성과 차트가 여기에 표시됩니다</p>
            <p className="text-sm mt-1">Analytics API 연동 후 활성화</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, href }: { 
  icon: string; 
  label: string; 
  value: string | number; 
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  href?: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20',
  };

  const content = (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-xl p-4 border ${href ? 'hover:border-opacity-50 cursor-pointer' : ''} transition-all`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function QuickAction({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-white">{label}</span>
    </Link>
  );
}

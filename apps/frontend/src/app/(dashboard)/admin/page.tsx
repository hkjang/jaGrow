'use client';

import { useEffect, useState } from 'react';

interface TenantSummary {
  totalTenants: number;
  activeTenants: number;
  totalEvents: number;
  totalCost: number;
}

interface IntegrationSummary {
  platform: string;
  connected: number;
  expiringSoon: number;
  errors: number;
}

interface RecentActivity {
  id: string;
  action: string;
  resource: string;
  user: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [tenantSummary] = useState<TenantSummary>({
    totalTenants: 12,
    activeTenants: 10,
    totalEvents: 15420000,
    totalCost: 4523.50,
  });

  const [integrations] = useState<IntegrationSummary[]>([
    { platform: 'Google Ads', connected: 8, expiringSoon: 1, errors: 0 },
    { platform: 'Meta', connected: 6, expiringSoon: 0, errors: 1 },
    { platform: 'TikTok', connected: 4, expiringSoon: 2, errors: 0 },
    { platform: 'Naver', connected: 3, expiringSoon: 0, errors: 0 },
    { platform: 'Kakao', connected: 2, expiringSoon: 0, errors: 0 },
  ]);

  const [recentActivity] = useState<RecentActivity[]>([
    { id: '1', action: 'approve', resource: 'Experiment #42', user: 'admin@jagrow.io', timestamp: '2 min ago' },
    { id: '2', action: 'connect', resource: 'Google Ads Account', user: 'ops@jagrow.io', timestamp: '15 min ago' },
    { id: '3', action: 'update', resource: 'Budget Rule #7', user: 'admin@jagrow.io', timestamp: '1 hour ago' },
    { id: '4', action: 'create', resource: 'New Tenant: Acme Corp', user: 'super@jagrow.io', timestamp: '2 hours ago' },
  ]);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenancy Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of all tenants and platform health</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25">
          + New Tenant
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="🏢"
          label="Total Tenants"
          value={tenantSummary.totalTenants}
          subValue={`${tenantSummary.activeTenants} active`}
          trend="+2 this month"
          trendUp={true}
        />
        <StatCard
          icon="📊"
          label="Total Events"
          value={formatNumber(tenantSummary.totalEvents)}
          subValue="Last 30 days"
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard
          icon="💰"
          label="Total Cost"
          value={`$${tenantSummary.totalCost.toLocaleString()}`}
          subValue="This month"
          trend="-3.2%"
          trendUp={false}
        />
        <StatCard
          icon="⚡"
          label="P95 Response"
          value="42ms"
          subValue="API latency"
          trend="Normal"
          trendUp={true}
        />
      </div>

      {/* Integration Status & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integration Status */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Integration Status</h3>
            <a href="/admin/integrations" className="text-sm text-blue-400 hover:text-blue-300">
              View All →
            </a>
          </div>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.platform}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <span className="text-lg">
                      {integration.platform === 'Google Ads' ? '🔍' :
                       integration.platform === 'Meta' ? '📘' :
                       integration.platform === 'TikTok' ? '🎵' :
                       integration.platform === 'Naver' ? '🇰🇷' : '💬'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{integration.platform}</p>
                    <p className="text-sm text-slate-400">{integration.connected} connected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integration.expiringSoon > 0 && (
                    <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                      {integration.expiringSoon} expiring
                    </span>
                  )}
                  {integration.errors > 0 && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                      {integration.errors} error
                    </span>
                  )}
                  {integration.expiringSoon === 0 && integration.errors === 0 && (
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                      Healthy
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <a href="/admin/audit" className="text-sm text-blue-400 hover:text-blue-300">
              View All →
            </a>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.action === 'approve' ? 'bg-green-500/20 text-green-400' :
                  activity.action === 'connect' ? 'bg-blue-500/20 text-blue-400' :
                  activity.action === 'update' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {activity.action === 'approve' ? '✓' :
                   activity.action === 'connect' ? '🔗' :
                   activity.action === 'update' ? '✏️' : '+'}
                </div>
                <div className="flex-1">
                  <p className="text-white">
                    <span className="capitalize">{activity.action}</span>{' '}
                    <span className="text-slate-400">{activity.resource}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {activity.user} · {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">2 Security Alerts</h3>
            <p className="text-slate-400">1 token expiring soon, 1 abnormal access detected</p>
          </div>
          <a
            href="/admin/security"
            className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg font-medium hover:bg-orange-500/30 transition-colors"
          >
            Review Alerts
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  trend, 
  trendUp 
}: { 
  icon: string;
  label: string; 
  value: string | number; 
  subValue: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-xl">{icon}</span>
        </div>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">{subValue}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            trendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

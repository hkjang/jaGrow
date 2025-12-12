'use client';

import { useState, useEffect } from 'react';

interface IntegrationStatus {
  id: string;
  tenantId: string;
  platform: string;
  accountId: string;
  tokenStatus: string;
  tokenExpiresAt: string | null;
  lastSyncAt: string | null;
  lastErrorMessage: string | null;
  apiErrorRate: number;
  isActive: boolean;
}

const platformIcons: Record<string, string> = {
  'GOOGLE': '🔍',
  'META': '📘',
  'TIKTOK': '🎵',
  'NAVER': '🟢',
  'KAKAO': '💬',
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/admin/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-600/20 text-green-400';
      case 'expiring': return 'bg-yellow-600/20 text-yellow-400';
      case 'expired': return 'bg-red-600/20 text-red-400';
      case 'revoked': return 'bg-red-600/20 text-red-400';
      default: return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🔗 플랫폼 연동</h1>
          <p className="text-slate-400 mt-1">광고 플랫폼 연동 상태를 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 연동
        </button>
      </div>

      {/* 플랫폼 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(platformIcons).map(([platform, icon]) => {
          const count = integrations.filter(i => i.platform === platform && i.isActive).length;
          return (
            <div key={platform} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{platform}</h3>
                  <p className="text-slate-400 text-sm">{count}개 연동</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr className="text-slate-400 text-sm">
                <th className="px-6 py-4 text-left">플랫폼</th>
                <th className="px-6 py-4 text-left">계정 ID</th>
                <th className="px-6 py-4 text-center">토큰 상태</th>
                <th className="px-6 py-4 text-center">마지막 동기화</th>
                <th className="px-6 py-4 text-center">에러율</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {integrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    연동된 플랫폼이 없습니다.
                  </td>
                </tr>
              ) : (
                integrations.map((integration) => (
                  <tr key={integration.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{platformIcons[integration.platform] || '📱'}</span>
                        <span className="text-white">{integration.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{integration.accountId}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(integration.tokenStatus)}`}>
                        {integration.tokenStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {integration.lastSyncAt 
                        ? new Date(integration.lastSyncAt).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`${
                        integration.apiErrorRate > 0.1 
                          ? 'text-red-400' 
                          : integration.apiErrorRate > 0.05 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                      }`}>
                        {(integration.apiErrorRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-1 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">
                          재인증
                        </button>
                        <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                          설정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Integration {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  tokenStatus: 'valid' | 'expiring' | 'expired';
  tokenExpiresAt: string;
  lastSyncAt: string;
  apiErrorRate: number;
  isActive: boolean;
}


const platforms = [
  { id: 'google', name: 'Google Ads', icon: '🔍' },
  { id: 'meta', name: 'Meta', icon: '📘' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'naver', name: 'Naver', icon: '🇰🇷' },
  { id: 'kakao', name: 'Kakao', icon: '💬' },
];

const platformIcons: Record<string, string> = {
  'Google Ads': '🔍', 'Meta': '📘', 'TikTok': '🎵', 'Naver': '🇰🇷', 'Kakao': '💬',
  'GOOGLE': '🔍', 'META': '📘', 'TIKTOK': '🎵', 'NAVER': '🇰🇷', 'KAKAO': '💬'
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  
  // Modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState('');
  const [formData, setFormData] = useState({ accountId: '', accountName: '' });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/integrations`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setIntegrations(data);
        } else {
          loadMockData();
        }
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
    setIntegrations([
      { id: '1', platform: 'Google Ads', accountId: 'ga_12345', accountName: 'Main Account', tokenStatus: 'valid', tokenExpiresAt: '2025-02-15', lastSyncAt: '5 min ago', apiErrorRate: 0.1, isActive: true },
      { id: '2', platform: 'Google Ads', accountId: 'ga_67890', accountName: 'Secondary', tokenStatus: 'expiring', tokenExpiresAt: '2024-12-20', lastSyncAt: '10 min ago', apiErrorRate: 0.2, isActive: true },
      { id: '3', platform: 'Meta', accountId: 'fb_11111', accountName: 'Facebook Ads', tokenStatus: 'valid', tokenExpiresAt: '2025-01-30', lastSyncAt: '2 min ago', apiErrorRate: 0, isActive: true },
      { id: '4', platform: 'Meta', accountId: 'fb_22222', accountName: 'Instagram', tokenStatus: 'expired', tokenExpiresAt: '2024-11-10', lastSyncAt: 'N/A', apiErrorRate: 100, isActive: false },
      { id: '5', platform: 'TikTok', accountId: 'tt_33333', accountName: 'TikTok Business', tokenStatus: 'valid', tokenExpiresAt: '2025-03-01', lastSyncAt: '15 min ago', apiErrorRate: 0.5, isActive: true },
    ]);
  };

  const openConnectModal = (platform: string) => {
    setConnectPlatform(platform);
    setFormData({ accountId: '', accountName: '' });
    setShowConnectModal(true);
  };

  const handleConnect = async () => {
    if (!formData.accountId.trim() || !formData.accountName.trim()) {
      alert('계정 ID와 이름을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      const platformName = platforms.find(p => p.id === connectPlatform)?.name || connectPlatform;
      
      const response = await fetch(`${API_BASE}/admin/integrations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          platform: platformName.toUpperCase().replace(' ', '_'),
          accountId: formData.accountId,
          accountName: formData.accountName
        })
      });

      if (response.ok) {
        fetchIntegrations(); // Refresh list
      } else {
        // Mock create for UI demo
        const newIntegration: Integration = {
          id: Date.now().toString(),
          platform: platformName,
          accountId: formData.accountId,
          accountName: formData.accountName,
          tokenStatus: 'valid',
          tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          lastSyncAt: 'Just now',
          apiErrorRate: 0,
          isActive: true
        };
        setIntegrations([...integrations, newIntegration]);
      }
      setShowConnectModal(false);
    } catch (error) {
      // Mock create for demo
      const newIntegration: Integration = {
        id: Date.now().toString(),
        platform: platforms.find(p => p.id === connectPlatform)?.name || connectPlatform,
        accountId: formData.accountId,
        accountName: formData.accountName,
        tokenStatus: 'valid',
        tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastSyncAt: 'Just now',
        apiErrorRate: 0,
        isActive: true
      };
      setIntegrations([...integrations, newIntegration]);
      setShowConnectModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshToken = async (integration: Integration) => {
    try {
      await fetch(`${API_BASE}/admin/integrations/${integration.id}/refresh-token`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
    // Update UI optimistically
    setIntegrations(integrations.map(i =>
      i.id === integration.id
        ? {
            ...i,
            tokenStatus: 'valid' as const,
            tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lastSyncAt: 'Just now'
          }
        : i
    ));
  };

  const handleDisconnect = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/integrations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchIntegrations(); // Refresh list
      } else {
        setIntegrations(integrations.filter(i => i.id !== id));
      }
    } catch (error) {
      setIntegrations(integrations.filter(i => i.id !== id));
    }
    setShowDeleteConfirm(null);
  };

  const handleSync = async (integration: Integration) => {
    try {
      await fetch(`${API_BASE}/admin/integrations/${integration.id}/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Failed to sync:', error);
    }
    setIntegrations(integrations.map(i =>
      i.id === integration.id ? { ...i, lastSyncAt: 'Just now' } : i
    ));
  };

  const filteredIntegrations = integrations.filter(i =>
    selectedPlatform === 'all' || i.platform === selectedPlatform
  );

  const uniquePlatforms = [...new Set(integrations.map(i => i.platform))];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ad Integrations</h1>
          <p className="text-slate-400 mt-1">Manage connected ad platform accounts</p>
        </div>
        <div className="relative group">
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
            + Connect Account
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-10">
            {platforms.map(p => (
              <button
                key={p.id}
                onClick={() => openConnectModal(p.id)}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
              >
                <span>{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard icon="🔗" label="Total Connected" value={integrations.filter(i => i.isActive).length} color="blue" />
        <SummaryCard icon="✓" label="Healthy" value={integrations.filter(i => i.tokenStatus === 'valid' && i.isActive).length} color="green" />
        <SummaryCard icon="⏰" label="Expiring Soon" value={integrations.filter(i => i.tokenStatus === 'expiring').length} color="yellow" />
        <SummaryCard icon="⚠️" label="Needs Action" value={integrations.filter(i => i.tokenStatus === 'expired' || i.apiErrorRate > 5).length} color="red" />
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedPlatform === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Platforms
        </button>
        {uniquePlatforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedPlatform === platform ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{platformIcons[platform]}</span>
            {platform}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border transition-all ${
              !integration.isActive
                ? 'border-red-500/30 opacity-60'
                : integration.tokenStatus === 'expiring'
                ? 'border-yellow-500/30'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
                  {platformIcons[integration.platform]}
                </div>
                <div>
                  <p className="text-white font-semibold">{integration.accountName}</p>
                  <p className="text-sm text-slate-400">{integration.platform}</p>
                </div>
              </div>
              <StatusBadge status={integration.tokenStatus} />
            </div>

            <div className="space-y-3 mb-4">
              <InfoRow label="Account ID" value={integration.accountId} />
              <InfoRow label="Last Sync" value={integration.lastSyncAt} />
              <InfoRow label="Token Expires" value={integration.tokenExpiresAt} />
              <InfoRow label="API Error Rate" value={`${integration.apiErrorRate}%`} highlight={integration.apiErrorRate > 1} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleRefreshToken(integration)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh Token
              </button>
              <button
                onClick={() => handleSync(integration)}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
              >
                ⚡ Sync
              </button>
              <button
                onClick={() => setShowDeleteConfirm(integration.id)}
                className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>{platforms.find(p => p.id === connectPlatform)?.icon}</span>
              Connect {platforms.find(p => p.id === connectPlatform)?.name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Account ID *</label>
                <input
                  type="text"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="예: ga_12345"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Account Name *</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="예: Main Account"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  실제 연동 시 OAuth 인증 페이지로 리다이렉트됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {saving ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-2">Disconnect Account?</h2>
            <p className="text-slate-400 mb-6">This will remove the integration and stop data sync.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisconnect(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: 'blue' | 'green' | 'yellow' | 'red' }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-xl p-4 border`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'valid' | 'expiring' | 'expired' }) {
  const config = {
    valid: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Valid' },
    expiring: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Expiring' },
    expired: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Expired' },
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${config[status].bg} ${config[status].text}`}>
      {config[status].label}
    </span>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={highlight ? 'text-red-400' : 'text-white'}>{value}</span>
    </div>
  );
}

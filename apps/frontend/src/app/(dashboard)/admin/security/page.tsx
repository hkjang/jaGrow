'use client';

import { useState, useEffect } from 'react';

interface SecurityAlert {
  id: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

const API_URL = 'http://localhost:4000';

const severityConfig = {
  low: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

export default function SecurityPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/security/alerts`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
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
    setAlerts([
      { id: '1', alertType: 'token_expired', severity: 'high', source: 'integration:fb_22222', description: 'Meta token expired, re-authentication required', isResolved: false, createdAt: '2024-12-12 18:00' },
      { id: '2', alertType: 'abnormal_access', severity: 'critical', source: 'user:u5', description: '127 API calls in last hour from user@external.com', isResolved: false, createdAt: '2024-12-12 17:30' },
      { id: '3', alertType: 'rate_limit', severity: 'medium', source: 'integration:ga_12345', description: 'Google Ads API rate limit at 85%', isResolved: false, createdAt: '2024-12-12 16:00' },
      { id: '4', alertType: 'pii_detected', severity: 'high', source: 'event:purchase', description: 'Potential PII detected in event payload', isResolved: true, resolvedBy: 'admin', resolvedAt: '2024-12-12 15:00', createdAt: '2024-12-12 14:00' },
      { id: '5', alertType: 'token_expiring', severity: 'low', source: 'integration:tt_33333', description: 'TikTok token expires in 5 days', isResolved: true, resolvedBy: 'system', resolvedAt: '2024-12-12 12:00', createdAt: '2024-12-12 10:00' },
    ]);
  };

  const handleResolve = async () => {
    if (!showResolveModal) return;
    
    setSaving(true);
    try {
      setAlerts(alerts.map(a =>
        a.id === showResolveModal
          ? { ...a, isResolved: true, resolvedBy: 'admin', resolvedAt: new Date().toISOString() }
          : a
      ));
      setShowResolveModal(null);
      setResolution('');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickResolve = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id
        ? { ...a, isResolved: true, resolvedBy: 'admin', resolvedAt: new Date().toISOString() }
        : a
    ));
  };

  const handleReopen = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id
        ? { ...a, isResolved: false, resolvedBy: undefined, resolvedAt: undefined }
        : a
    ));
  };

  const handleDelete = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleCheckTokens = () => {
    // Simulate token check
    const tokenIssues = alerts.filter(a => a.alertType.includes('token') && !a.isResolved);
    alert(`${tokenIssues.length}개의 토큰 관련 이슈가 발견되었습니다.`);
  };

  const handleRunPIIScan = () => {
    // Simulate PII scan
    alert('PII 스캔이 시작되었습니다. 완료 시 알림을 받습니다.');
  };

  const filteredAlerts = alerts.filter(a => showResolved || !a.isResolved);
  const unresolvedCount = alerts.filter(a => !a.isResolved).length;
  const criticalCount = alerts.filter(a => !a.isResolved && a.severity === 'critical').length;

  const getAlertIcon = (alertType: string) => {
    if (alertType.includes('token')) return '🔑';
    if (alertType.includes('access')) return '👤';
    if (alertType.includes('rate')) return '⏱️';
    if (alertType.includes('pii')) return '📝';
    return '⚠️';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Center</h1>
          <p className="text-slate-400 mt-1">Monitor and respond to security alerts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCheckTokens}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
          >
            🔄 Check Tokens
          </button>
          <button
            onClick={handleRunPIIScan}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            🔒 PII Scan
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-6 rounded-2xl border ${criticalCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${criticalCount > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              {criticalCount > 0 ? '🚨' : '✓'}
            </div>
            <div>
              <p className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {unresolvedCount}
              </p>
              <p className="text-slate-400">Unresolved Alerts</p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">🔐</div>
            <div>
              <p className="text-3xl font-bold text-white">23</p>
              <p className="text-slate-400">Active Sessions</p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">🛡️</div>
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-slate-400">MFA Adoption</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
          />
          Show resolved alerts
        </label>
        <span className="text-slate-500">|</span>
        <span className="text-sm text-slate-400">
          {filteredAlerts.length} alerts shown
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-2xl border transition-all ${
              alert.isResolved
                ? 'bg-slate-800/30 border-slate-700 opacity-60'
                : `bg-slate-800/50 ${severityConfig[alert.severity].border}`
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${severityConfig[alert.severity].bg}`}>
                {getAlertIcon(alert.alertType)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium uppercase ${severityConfig[alert.severity].bg} ${severityConfig[alert.severity].text}`}>
                    {alert.severity}
                  </span>
                  <span className="text-white font-semibold">{alert.alertType.replace(/_/g, ' ')}</span>
                  {alert.isResolved && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                      Resolved
                    </span>
                  )}
                </div>
                <p className="text-slate-300">{alert.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-slate-500">Source: <span className="text-slate-400 font-mono">{alert.source}</span></span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500">{alert.createdAt}</span>
                  {alert.resolvedAt && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-green-400/70">Resolved by {alert.resolvedBy} at {alert.resolvedAt}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!alert.isResolved ? (
                  <>
                    <button
                      onClick={() => handleQuickResolve(alert.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      ✓ Resolve
                    </button>
                    <button
                      onClick={() => setShowResolveModal(alert.id)}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
                    >
                      ✓ With Note
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleReopen(alert.id)}
                      className="px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600 hover:text-white transition-colors"
                    >
                      Reopen
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Resolve Alert</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Resolution Notes</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                  placeholder="해결 방법 및 조치 내용을 입력하세요"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResolveModal(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Resolving...' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

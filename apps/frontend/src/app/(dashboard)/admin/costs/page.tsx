'use client';

import { useState, useEffect } from 'react';

interface CostQuota {
  id: string;
  tenantName: string;
  quotaType: string;
  limitValue: number;
  currentValue: number;
  usagePercent: number;
  period: string;
  alertThreshold: number;
  isAutoBlock: boolean;
}

const API_URL = 'http://localhost:4000';

const costBreakdown = [
  { category: 'Event Processing', cost: 2340.50, trend: '+12%' },
  { category: 'Storage', cost: 890.00, trend: '+5%' },
  { category: 'API Queries', cost: 456.80, trend: '-3%' },
  { category: 'Data Transfer', cost: 320.25, trend: '+8%' },
];

export default function CostsPage() {
  const [quotas, setQuotas] = useState<CostQuota[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingQuota, setEditingQuota] = useState<CostQuota | null>(null);
  const [formData, setFormData] = useState({
    tenantName: '',
    quotaType: 'events',
    limitValue: 1000000,
    alertThreshold: 80,
    isAutoBlock: false
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotas();
  }, []);

  const fetchQuotas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/costs/quotas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQuotas(data);
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
    setQuotas([
      { id: '1', tenantName: 'Acme Corporation', quotaType: 'events', limitValue: 10000000, currentValue: 5420000, usagePercent: 54.2, period: 'monthly', alertThreshold: 80, isAutoBlock: false },
      { id: '2', tenantName: 'Acme Corporation', quotaType: 'storage', limitValue: 10737418240, currentValue: 2147483648, usagePercent: 20, period: 'monthly', alertThreshold: 80, isAutoBlock: false },
      { id: '3', tenantName: 'StartupXYZ', quotaType: 'events', limitValue: 2000000, currentValue: 1840000, usagePercent: 92, period: 'monthly', alertThreshold: 80, isAutoBlock: true },
      { id: '4', tenantName: 'TechGlobal', quotaType: 'events', limitValue: 20000000, currentValue: 8750000, usagePercent: 43.75, period: 'monthly', alertThreshold: 80, isAutoBlock: false },
      { id: '5', tenantName: 'TechGlobal', quotaType: 'api_calls', limitValue: 1000000, currentValue: 850000, usagePercent: 85, period: 'monthly', alertThreshold: 75, isAutoBlock: false },
    ]);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ tenantName: '', quotaType: 'events', limitValue: 1000000, alertThreshold: 80, isAutoBlock: false });
    setEditingQuota(null);
    setShowModal(true);
  };

  const openEditModal = (quota: CostQuota) => {
    setModalMode('edit');
    setFormData({
      tenantName: quota.tenantName,
      quotaType: quota.quotaType,
      limitValue: quota.limitValue,
      alertThreshold: quota.alertThreshold,
      isAutoBlock: quota.isAutoBlock
    });
    setEditingQuota(quota);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.tenantName.trim()) {
      alert('테넌트를 선택해주세요');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        const newQuota: CostQuota = {
          id: Date.now().toString(),
          tenantName: formData.tenantName,
          quotaType: formData.quotaType,
          limitValue: formData.limitValue,
          currentValue: 0,
          usagePercent: 0,
          period: 'monthly',
          alertThreshold: formData.alertThreshold,
          isAutoBlock: formData.isAutoBlock
        };
        setQuotas([...quotas, newQuota]);
      } else if (editingQuota) {
        setQuotas(quotas.map(q =>
          q.id === editingQuota.id
            ? { ...q, ...formData, usagePercent: (q.currentValue / formData.limitValue) * 100 }
            : q
        ));
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setQuotas(quotas.filter(q => q.id !== id));
    setShowDeleteConfirm(null);
  };

  const toggleAutoBlock = (quota: CostQuota) => {
    setQuotas(quotas.map(q =>
      q.id === quota.id ? { ...q, isAutoBlock: !q.isAutoBlock } : q
    ));
  };

  const totalCost = costBreakdown.reduce((sum, c) => sum + c.cost, 0);
  const alertingQuotas = quotas.filter(q => q.usagePercent >= q.alertThreshold);

  const quotaTypes = [
    { value: 'events', label: 'Events' },
    { value: 'storage', label: 'Storage' },
    { value: 'api_calls', label: 'API Calls' },
    { value: 'export', label: 'Exports' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cost & Quotas</h1>
          <p className="text-slate-400 mt-1">Monitor costs and manage usage quotas</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
        >
          + Set Quota
        </button>
      </div>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Total Cost (This Month)</h3>
          <p className="text-4xl font-bold text-white mb-4">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">-3.2%</span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Cost Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {costBreakdown.map((item) => (
              <div key={item.category} className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-slate-400 text-sm mb-1">{item.category}</p>
                <p className="text-xl font-bold text-white">${item.cost.toFixed(2)}</p>
                <span className={`text-xs ${item.trend.startsWith('+') ? 'text-red-400' : 'text-green-400'}`}>
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alertingQuotas.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-2xl p-5 border border-orange-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{alertingQuotas.length} Quota Alerts</h3>
              <p className="text-slate-400">
                {alertingQuotas.map(q => `${q.tenantName} (${q.quotaType})`).join(', ')} exceeding threshold
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quotas Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">Usage Quotas</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Limit</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Auto Block</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {quotas.map((quota) => (
              <tr key={quota.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 text-white font-medium">{quota.tenantName}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-full capitalize">
                    {quota.quotaType.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="w-32">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{quota.usagePercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          quota.usagePercent >= quota.alertThreshold
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ width: `${Math.min(quota.usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400">{formatNumber(quota.limitValue)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleAutoBlock(quota)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      quota.isAutoBlock
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    } transition-colors`}
                  >
                    {quota.isAutoBlock ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(quota)}
                      className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(quota.id)}
                      className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {modalMode === 'create' ? 'Set Quota' : 'Edit Quota'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tenant *</label>
                <input
                  type="text"
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="예: Acme Corporation"
                  disabled={modalMode === 'edit'}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Quota Type</label>
                <select
                  value={formData.quotaType}
                  onChange={(e) => setFormData({ ...formData, quotaType: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  disabled={modalMode === 'edit'}
                >
                  {quotaTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Limit Value</label>
                <input
                  type="number"
                  value={formData.limitValue}
                  onChange={(e) => setFormData({ ...formData, limitValue: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Alert Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) || 80 })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoBlock"
                  checked={formData.isAutoBlock}
                  onChange={(e) => setFormData({ ...formData, isAutoBlock: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                />
                <label htmlFor="autoBlock" className="text-sm text-slate-400">
                  Auto-block when limit exceeded
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-2">Delete Quota?</h2>
            <p className="text-slate-400 mb-6">This will remove the quota limit for this tenant.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

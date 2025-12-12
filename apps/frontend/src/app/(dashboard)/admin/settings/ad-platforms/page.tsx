'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PlatformConfig {
  id: string;
  platform: string;
  authConfig: any;
  tokenAutoRefresh: boolean;
  refreshInterval: number;
  isActive: boolean;
  trackingConfigs?: TrackingConfig[];
}

interface TrackingConfig {
  id: string;
  eventType: string;
  isEnabled: boolean;
  clickIdMatching: boolean;
  conversionPriority: number;
}

interface BudgetConfig {
  id: string;
  budgetType: string;
  defaultAmount: number;
  currency: string;
  autoStopEnabled: boolean;
  autoStopKpi?: string;
  autoStopThreshold?: number;
}

export default function AdPlatformSettingsPage() {
  const [platformConfigs, setPlatformConfigs] = useState<PlatformConfig[]>([]);
  const [budgetConfigs, setBudgetConfigs] = useState<BudgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'platforms' | 'tracking' | 'budgets'>('platforms');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [platformsRes, budgetsRes] = await Promise.all([
        fetch(`${API_BASE}/settings/ad-platforms/configs`),
        fetch(`${API_BASE}/settings/ad-platforms/budgets`),
      ]);
      if (platformsRes.ok) setPlatformConfigs(await platformsRes.json());
      if (budgetsRes.ok) setBudgetConfigs(await budgetsRes.json());
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    if (activeTab === 'platforms') {
      url = `${API_BASE}/settings/ad-platforms/configs${editingItem ? `/${editingItem.id}` : ''}`;
    } else if (activeTab === 'budgets') {
      url = `${API_BASE}/settings/ad-platforms/budgets${editingItem ? `/${editingItem.id}` : ''}`;
    }
    
    try {
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchData();
        setShowModal(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const url = type === 'platform'
      ? `${API_BASE}/settings/ad-platforms/configs/${id}`
      : `${API_BASE}/settings/ad-platforms/budgets/${id}`;
    try {
      await fetch(url, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = { GOOGLE: 'Google Ads', META: 'Meta (Facebook)', TIKTOK: 'TikTok' };
    return labels[platform] || platform;
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">광고 플랫폼 설정</h1>
        <button
          onClick={() => { setShowModal(true); setEditingItem(null); setFormData({}); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {['platforms', 'tracking', 'budgets'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            {tab === 'platforms' ? '플랫폼 등록' : tab === 'tracking' ? '트래킹 설정' : '예산 설정'}
          </button>
        ))}
      </div>

      {activeTab === 'platforms' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platformConfigs.map((config) => (
            <div key={config.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{getPlatformLabel(config.platform)}</h3>
                <span className={`px-2 py-1 text-xs rounded ${config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {config.isActive ? '연결됨' : '비활성'}
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>토큰 자동 갱신: {config.tokenAutoRefresh ? '활성' : '비활성'}</p>
                <p>갱신 주기: {config.refreshInterval}초</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setEditingItem(config); setFormData(config); setShowModal(true); }}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  수정
                </button>
                <button onClick={() => handleDelete(config.id, 'platform')} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기본 금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">자동 중지</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {budgetConfigs.map((config) => (
                <tr key={config.id}>
                  <td className="px-6 py-4 text-sm">{config.budgetType === 'daily' ? '일간' : config.budgetType === 'weekly' ? '주간' : '월간'}</td>
                  <td className="px-6 py-4 text-sm">{config.defaultAmount.toLocaleString()} {config.currency}</td>
                  <td className="px-6 py-4 text-sm">
                    {config.autoStopEnabled ? `${config.autoStopKpi} < ${config.autoStopThreshold}` : '비활성'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingItem(config); setFormData(config); setShowModal(true); }} className="text-blue-600 hover:underline mr-3">수정</button>
                    <button onClick={() => handleDelete(config.id, 'budget')} className="text-red-600 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {platformConfigs.map((platform) => (
            <div key={platform.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{getPlatformLabel(platform.platform)} 트래킹</h3>
              {platform.trackingConfigs && platform.trackingConfigs.length > 0 ? (
                <div className="space-y-2">
                  {platform.trackingConfigs.map((tc) => (
                    <div key={tc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <span className="font-medium">{tc.eventType.toUpperCase()}</span>
                        <span className="ml-2 text-sm text-gray-500">우선순위: {tc.conversionPriority}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={tc.isEnabled} readOnly className="rounded" />
                          활성
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={tc.clickIdMatching} readOnly className="rounded" />
                          클릭ID 매칭
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">설정된 트래킹이 없습니다.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{editingItem ? '수정' : '추가'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'platforms' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">플랫폼</label>
                    <select
                      value={formData.platform || ''}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    >
                      <option value="">선택</option>
                      <option value="GOOGLE">Google Ads</option>
                      <option value="META">Meta (Facebook)</option>
                      <option value="TIKTOK">TikTok</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.tokenAutoRefresh || false}
                      onChange={(e) => setFormData({ ...formData, tokenAutoRefresh: e.target.checked })}
                    />
                    <label className="text-sm">토큰 자동 갱신</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">갱신 주기 (초)</label>
                    <input
                      type="number"
                      value={formData.refreshInterval || 3600}
                      onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                </>
              )}
              {activeTab === 'budgets' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">예산 유형</label>
                    <select
                      value={formData.budgetType || ''}
                      onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    >
                      <option value="">선택</option>
                      <option value="daily">일간</option>
                      <option value="weekly">주간</option>
                      <option value="monthly">월간</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">기본 금액</label>
                    <input
                      type="number"
                      value={formData.defaultAmount || ''}
                      onChange={(e) => setFormData({ ...formData, defaultAmount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.autoStopEnabled || false}
                      onChange={(e) => setFormData({ ...formData, autoStopEnabled: e.target.checked })}
                    />
                    <label className="text-sm">자동 중지 활성</label>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

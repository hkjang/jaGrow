'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SegmentRule {
  id: string;
  name: string;
  ruleType: string;
  conditions: any;
  autoGenerate: boolean;
  isActive: boolean;
}

interface AudienceSync {
  id: string;
  platform: string;
  audienceId: string;
  segmentRuleId?: string;
  syncEnabled: boolean;
  syncFrequency: string;
  lastSyncAt?: string;
}

export default function SegmentSettingsPage() {
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [syncs, setSyncs] = useState<AudienceSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'sync'>('rules');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, syncsRes] = await Promise.all([
        fetch(`${API_BASE}/settings/segments/rules`),
        fetch(`${API_BASE}/settings/segments/audience-sync`),
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (syncsRes.ok) setSyncs(await syncsRes.json());
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = activeTab === 'rules'
      ? `${API_BASE}/settings/segments/rules${editingItem ? `/${editingItem.id}` : ''}`
      : `${API_BASE}/settings/segments/audience-sync${editingItem ? `/${editingItem.id}` : ''}`;

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
    const url = type === 'rule'
      ? `${API_BASE}/settings/segments/rules/${id}`
      : `${API_BASE}/settings/segments/audience-sync/${id}`;
    try {
      await fetch(url, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const triggerSync = async (id: string) => {
    try {
      await fetch(`${API_BASE}/settings/segments/audience-sync/${id}/sync`, { method: 'POST' });
      fetchData();
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      behavior: '행동 기반',
      time: '시간 기반',
      value: '가치 기반',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">세그먼트·오디언스 설정</h1>
        <button
          onClick={() => { setShowModal(true); setEditingItem(null); setFormData(activeTab === 'rules' ? { ruleType: 'behavior', conditions: {}, isActive: true } : { platform: 'GOOGLE', syncEnabled: true, syncFrequency: 'daily' }); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('rules')} className={`px-4 py-2 font-medium ${activeTab === 'rules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>세그먼트 규칙</button>
        <button onClick={() => setActiveTab('sync')} className={`px-4 py-2 font-medium ${activeTab === 'sync' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>오디언스 동기화</button>
      </div>

      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI 자동 생성</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 text-sm font-medium">{rule.name}</td>
                  <td className="px-6 py-4 text-sm">{getRuleTypeLabel(rule.ruleType)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${rule.autoGenerate ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.autoGenerate ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingItem(rule); setFormData(rule); setShowModal(true); }} className="text-blue-600 hover:underline mr-3">수정</button>
                    <button onClick={() => handleDelete(rule.id, 'rule')} className="text-red-600 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {syncs.map((sync) => (
            <div key={sync.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{sync.platform}</h3>
                <span className={`px-2 py-1 text-xs rounded ${sync.syncEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {sync.syncEnabled ? '활성' : '비활성'}
                </span>
              </div>
              <p className="text-sm text-gray-500">오디언스 ID: {sync.audienceId}</p>
              <p className="text-sm text-gray-500">동기화 주기: {sync.syncFrequency === 'realtime' ? '실시간' : sync.syncFrequency === 'hourly' ? '시간별' : '일별'}</p>
              {sync.lastSyncAt && <p className="text-xs text-gray-400 mt-2">마지막 동기화: {new Date(sync.lastSyncAt).toLocaleString()}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => triggerSync(sync.id)} className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded">동기화</button>
                <button onClick={() => { setEditingItem(sync); setFormData(sync); setShowModal(true); }} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">수정</button>
                <button onClick={() => handleDelete(sync.id, 'sync')} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{editingItem ? '수정' : '추가'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'rules' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">이름</label>
                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">규칙 유형</label>
                    <select value={formData.ruleType || 'behavior'} onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700">
                      <option value="behavior">행동 기반</option>
                      <option value="time">시간 기반</option>
                      <option value="value">가치 기반</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.autoGenerate || false} onChange={(e) => setFormData({ ...formData, autoGenerate: e.target.checked })} /><span className="text-sm">AI 자동 생성</span></label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive !== false} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /><span className="text-sm">활성화</span></label>
                  </div>
                </>
              )}
              {activeTab === 'sync' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">플랫폼</label>
                    <select value={formData.platform || 'GOOGLE'} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700">
                      <option value="GOOGLE">Google</option>
                      <option value="META">Meta</option>
                      <option value="TIKTOK">TikTok</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">오디언스 ID</label>
                    <input type="text" value={formData.audienceId || ''} onChange={(e) => setFormData({ ...formData, audienceId: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">동기화 주기</label>
                    <select value={formData.syncFrequency || 'daily'} onChange={(e) => setFormData({ ...formData, syncFrequency: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700">
                      <option value="realtime">실시간</option>
                      <option value="hourly">시간별</option>
                      <option value="daily">일별</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={formData.syncEnabled !== false} onChange={(e) => setFormData({ ...formData, syncEnabled: e.target.checked })} /><label className="text-sm">동기화 활성</label></div>
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

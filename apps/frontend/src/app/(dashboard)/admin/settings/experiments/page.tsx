'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ExperimentTemplate {
  id: string;
  name: string;
  templateType: string;
  defaultConfig: any;
  autoEndCriteria?: any;
  isActive: boolean;
}

interface ExperimentAutoConfig {
  id: string;
  winnerKpi: string;
  minSampleSize: number;
  autoApply: boolean;
  autoRollback: boolean;
  rollbackThreshold?: number;
}

interface StatisticalConfig {
  id: string;
  confidenceLevel: number;
  method: string;
  priorConfig?: any;
}

export default function ExperimentSettingsPage() {
  const [templates, setTemplates] = useState<ExperimentTemplate[]>([]);
  const [autoConfig, setAutoConfig] = useState<ExperimentAutoConfig | null>(null);
  const [statConfig, setStatConfig] = useState<StatisticalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'auto' | 'stats'>('templates');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, autoRes, statRes] = await Promise.all([
        fetch(`${API_BASE}/settings/experiments/templates`),
        fetch(`${API_BASE}/settings/experiments/auto-config/current`),
        fetch(`${API_BASE}/settings/experiments/statistical-config/current`),
      ]);
      if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (autoRes.ok) setAutoConfig(await autoRes.json());
      if (statRes.ok) setStatConfig(await statRes.json());
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    if (activeTab === 'templates') url = `${API_BASE}/settings/experiments/templates${editingItem ? `/${editingItem.id}` : ''}`;
    else if (activeTab === 'auto') url = `${API_BASE}/settings/experiments/auto-config${autoConfig ? `/${autoConfig.id}` : ''}`;
    else url = `${API_BASE}/settings/experiments/statistical-config${statConfig ? `/${statConfig.id}` : ''}`;

    try {
      const res = await fetch(url, {
        method: (activeTab !== 'templates' || editingItem) ? 'PUT' : 'POST',
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

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`${API_BASE}/settings/experiments/templates/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">실험 설정</h1>
        {activeTab === 'templates' && (
          <button
            onClick={() => { setShowModal(true); setEditingItem(null); setFormData({ templateType: 'ad', defaultConfig: {}, isActive: true }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 템플릿 추가
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {['templates', 'auto', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            {tab === 'templates' ? '실험 템플릿' : tab === 'auto' ? '자동화 설정' : '통계 설정'}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <span className={`px-2 py-1 text-xs rounded ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {template.isActive ? '활성' : '비활성'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                유형: {template.templateType === 'ad' ? '광고 실험' : '랜딩 실험'}
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditingItem(template); setFormData(template); setShowModal(true); }} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">수정</button>
                <button onClick={() => handleDelete(template.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'auto' && autoConfig && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">승자 판단 KPI</span>
              <span className="text-gray-600">{autoConfig.winnerKpi === 'conversion_rate' ? '전환율' : autoConfig.winnerKpi === 'roas' ? 'ROAS' : 'CTR'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">최소 샘플 수</span>
              <span className="text-gray-600">{autoConfig.minSampleSize.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">자동 적용</span>
              <span className={`px-2 py-1 text-xs rounded ${autoConfig.autoApply ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {autoConfig.autoApply ? '활성' : '비활성'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">자동 롤백</span>
              <span className={`px-2 py-1 text-xs rounded ${autoConfig.autoRollback ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {autoConfig.autoRollback ? '활성' : '비활성'}
              </span>
            </div>
            <button
              onClick={() => { setFormData(autoConfig); setShowModal(true); }}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              설정 수정
            </button>
          </div>
        </div>
      )}

      {activeTab === 'stats' && statConfig && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">신뢰 수준</span>
              <span className="text-gray-600">{(statConfig.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">통계 방식</span>
              <span className="text-gray-600">{statConfig.method === 'frequentist' ? '빈도주의' : '베이지안'}</span>
            </div>
            <button
              onClick={() => { setFormData(statConfig); setShowModal(true); }}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              설정 수정
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{activeTab === 'templates' ? (editingItem ? '템플릿 수정' : '템플릿 추가') : '설정 수정'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'templates' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">이름</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">유형</label>
                    <select
                      value={formData.templateType || 'ad'}
                      onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="ad">광고 실험</option>
                      <option value="landing">랜딩 실험</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isActive || false} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                    <label className="text-sm">활성화</label>
                  </div>
                </>
              )}
              {activeTab === 'auto' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">승자 판단 KPI</label>
                    <select
                      value={formData.winnerKpi || 'conversion_rate'}
                      onChange={(e) => setFormData({ ...formData, winnerKpi: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="conversion_rate">전환율</option>
                      <option value="roas">ROAS</option>
                      <option value="ctr">CTR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">최소 샘플 수</label>
                    <input
                      type="number"
                      value={formData.minSampleSize || 1000}
                      onChange={(e) => setFormData({ ...formData, minSampleSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.autoApply || false} onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })} />
                      <span className="text-sm">자동 적용</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.autoRollback !== false} onChange={(e) => setFormData({ ...formData, autoRollback: e.target.checked })} />
                      <span className="text-sm">자동 롤백</span>
                    </label>
                  </div>
                </>
              )}
              {activeTab === 'stats' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">신뢰 수준</label>
                    <select
                      value={formData.confidenceLevel || 0.95}
                      onChange={(e) => setFormData({ ...formData, confidenceLevel: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value={0.90}>90%</option>
                      <option value={0.95}>95%</option>
                      <option value={0.99}>99%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">통계 방식</label>
                    <select
                      value={formData.method || 'frequentist'}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="frequentist">빈도주의</option>
                      <option value="bayesian">베이지안</option>
                    </select>
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

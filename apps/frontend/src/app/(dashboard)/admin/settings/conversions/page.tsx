'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ConversionRule {
  id: string;
  name: string;
  eventType: string;
  conversionValue?: number;
  deduplicationRule?: string;
  lookbackWindow: number;
  isActive: boolean;
}

interface AttributionModel {
  id: string;
  modelType: string;
  isDefault: boolean;
  config?: any;
}

interface FunnelWeight {
  id: string;
  funnelStep: string;
  weight: number;
  autoOptimize: boolean;
}

export default function ConversionSettingsPage() {
  const [rules, setRules] = useState<ConversionRule[]>([]);
  const [attributionModels, setAttributionModels] = useState<AttributionModel[]>([]);
  const [funnelWeights, setFunnelWeights] = useState<FunnelWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'attribution' | 'funnel'>('rules');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, attrRes, funnelRes] = await Promise.all([
        fetch(`${API_BASE}/settings/conversions/rules`),
        fetch(`${API_BASE}/settings/conversions/attribution`),
        fetch(`${API_BASE}/settings/conversions/funnel-weights`),
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (attrRes.ok) setAttributionModels(await attrRes.json());
      if (funnelRes.ok) setFunnelWeights(await funnelRes.json());
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    if (activeTab === 'rules') url = `${API_BASE}/settings/conversions/rules${editingItem ? `/${editingItem.id}` : ''}`;
    else if (activeTab === 'attribution') url = `${API_BASE}/settings/conversions/attribution${editingItem ? `/${editingItem.id}` : ''}`;
    else url = `${API_BASE}/settings/conversions/funnel-weights${editingItem ? `/${editingItem.id}` : ''}`;

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
    const urls: Record<string, string> = {
      rule: `${API_BASE}/settings/conversions/rules/${id}`,
      attribution: `${API_BASE}/settings/conversions/attribution/${id}`,
      funnel: `${API_BASE}/settings/conversions/funnel-weights/${id}`,
    };
    try {
      await fetch(urls[type], { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      await fetch(`${API_BASE}/settings/conversions/attribution/${id}/default`, { method: 'PUT' });
      fetchData();
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: '구매',
      add_to_cart: '장바구니 추가',
      signup: '회원가입',
      lead: '리드',
    };
    return labels[type] || type;
  };

  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      last_touch: '라스트 터치',
      first_touch: '퍼스트 터치',
      linear: '선형',
      time_decay: '타임 디케이',
      data_driven: '데이터 기반',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">전환·어트리뷰션 설정</h1>
        <button
          onClick={() => { setShowModal(true); setEditingItem(null); setFormData({}); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {['rules', 'attribution', 'funnel'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            {tab === 'rules' ? '전환 규칙' : tab === 'attribution' ? '어트리뷰션 모델' : '퍼널 가중치'}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이벤트 유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">전환 값</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">룩백 윈도우</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 text-sm font-medium">{rule.name}</td>
                  <td className="px-6 py-4 text-sm">{getEventTypeLabel(rule.eventType)}</td>
                  <td className="px-6 py-4 text-sm">{rule.conversionValue?.toLocaleString() || '-'}</td>
                  <td className="px-6 py-4 text-sm">{rule.lookbackWindow}일</td>
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

      {activeTab === 'attribution' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {attributionModels.map((model) => (
            <div key={model.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${model.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{getModelTypeLabel(model.modelType)}</h3>
                {model.isDefault && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">기본값</span>}
              </div>
              <div className="flex gap-2 mt-4">
                {!model.isDefault && (
                  <button onClick={() => setAsDefault(model.id)} className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded">
                    기본값으로 설정
                  </button>
                )}
                <button onClick={() => { setEditingItem(model); setFormData(model); setShowModal(true); }} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">수정</button>
                <button onClick={() => handleDelete(model.id, 'attribution')} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'funnel' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-4">
            {funnelWeights.map((fw) => (
              <div key={fw.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <span className="font-medium">{fw.funnelStep === 'awareness' ? '인지' : fw.funnelStep === 'consideration' ? '고려' : '전환'}</span>
                  <span className="ml-4 text-sm text-gray-500">가중치: {(fw.weight * 100).toFixed(0)}%</span>
                  {fw.autoOptimize && <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">자동 최적화</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingItem(fw); setFormData(fw); setShowModal(true); }} className="text-blue-600 hover:underline">수정</button>
                  <button onClick={() => handleDelete(fw.id, 'funnel')} className="text-red-600 hover:underline">삭제</button>
                </div>
              </div>
            ))}
          </div>
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
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">이벤트 유형</label>
                    <select
                      value={formData.eventType || ''}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    >
                      <option value="">선택</option>
                      <option value="purchase">구매</option>
                      <option value="add_to_cart">장바구니 추가</option>
                      <option value="signup">회원가입</option>
                      <option value="lead">리드</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">전환 값</label>
                    <input
                      type="number"
                      value={formData.conversionValue || ''}
                      onChange={(e) => setFormData({ ...formData, conversionValue: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">룩백 윈도우 (일)</label>
                    <input
                      type="number"
                      value={formData.lookbackWindow || 30}
                      onChange={(e) => setFormData({ ...formData, lookbackWindow: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                </>
              )}
              {activeTab === 'attribution' && (
                <div>
                  <label className="block text-sm font-medium mb-1">모델 유형</label>
                  <select
                    value={formData.modelType || ''}
                    onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    required
                  >
                    <option value="">선택</option>
                    <option value="last_touch">라스트 터치</option>
                    <option value="first_touch">퍼스트 터치</option>
                    <option value="linear">선형</option>
                    <option value="time_decay">타임 디케이</option>
                    <option value="data_driven">데이터 기반</option>
                  </select>
                </div>
              )}
              {activeTab === 'funnel' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">퍼널 단계</label>
                    <select
                      value={formData.funnelStep || ''}
                      onChange={(e) => setFormData({ ...formData, funnelStep: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    >
                      <option value="">선택</option>
                      <option value="awareness">인지</option>
                      <option value="consideration">고려</option>
                      <option value="conversion">전환</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">가중치 (0-1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.weight || 0}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.autoOptimize || false}
                      onChange={(e) => setFormData({ ...formData, autoOptimize: e.target.checked })}
                    />
                    <label className="text-sm">자동 최적화</label>
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

'use client';

import { useState, useEffect } from 'react';

interface AIModelConfig {
  id: string;
  tenantId?: string;
  modelType: string;
  modelVersion: string;
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  isActive: boolean;
  config?: any;
  parameters?: AIModelParameter[];
  validations?: AIModelValidation[];
  createdAt: string;
  updatedAt: string;
}

interface AIModelParameter {
  id: string;
  paramName: string;
  paramValue: string;
  paramType: string;
}

interface AIModelValidation {
  id: string;
  accuracy?: number;
  regressionError?: number;
  trainedAt?: string;
  validatedAt: string;
  metrics?: any;
}

interface AIModelSafety {
  id: string;
  tenantId?: string;
  ruleType: string;
  ruleValue: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AIModelSettingsPage() {
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [safetyRules, setSafetyRules] = useState<AIModelSafety[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'models' | 'safety'>('models');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    modelType: 'prediction',
    modelVersion: '',
    provider: 'openai',
    baseUrl: '',
    apiKey: '',
    isActive: true,
    config: {},
    ruleType: 'forbidden_word',
    ruleValue: '',
    priority: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configsRes, safetyRes] = await Promise.all([
        fetch(`${API_BASE}/settings/ai-models/configs`),
        fetch(`${API_BASE}/settings/ai-models/safety`),
      ]);
      if (configsRes.ok) setConfigs(await configsRes.json());
      if (safetyRes.ok) setSafetyRules(await safetyRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isModel = activeTab === 'models';
    const url = isModel
      ? `${API_BASE}/settings/ai-models/configs${editingItem ? `/${editingItem.id}` : ''}`
      : `${API_BASE}/settings/ai-models/safety${editingItem ? `/${editingItem.id}` : ''}`;
    const method = editingItem ? 'PUT' : 'POST';
    const body = isModel
      ? { modelType: formData.modelType, modelVersion: formData.modelVersion, provider: formData.provider, baseUrl: formData.baseUrl || null, apiKey: formData.apiKey || null, isActive: formData.isActive, config: formData.config }
      : { ruleType: formData.ruleType, ruleValue: formData.ruleValue, priority: formData.priority, isActive: formData.isActive };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchData();
        setShowModal(false);
        setEditingItem(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string, type: 'model' | 'safety') => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const url = type === 'model'
      ? `${API_BASE}/settings/ai-models/configs/${id}`
      : `${API_BASE}/settings/ai-models/safety/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const openEditModal = (item: any, type: 'model' | 'safety') => {
    setEditingItem(item);
    if (type === 'model') {
      setFormData({
        ...formData,
        modelType: item.modelType,
        modelVersion: item.modelVersion,
        provider: item.provider,
        baseUrl: item.baseUrl || '',
        apiKey: item.apiKey || '',
        isActive: item.isActive,
        config: item.config || {},
      });
    } else {
      setFormData({
        ...formData,
        ruleType: item.ruleType,
        ruleValue: item.ruleValue,
        priority: item.priority,
        isActive: item.isActive,
      });
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      modelType: 'prediction',
      modelVersion: '',
      provider: 'openai',
      baseUrl: '',
      apiKey: '',
      isActive: true,
      config: {},
      ruleType: 'forbidden_word',
      ruleValue: '',
      priority: 0,
    });
  };

  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prediction: '광고 성과 예측',
      copywriting: '문구 생성 (LLM)',
      image_generation: '이미지 생성/편집',
    };
    return labels[type] || type;
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      forbidden_word: '금칙어',
      brand_guideline: '브랜드 가이드라인',
      ad_policy: '광고 정책',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI 모델 설정</h1>
        <button
          onClick={() => { setShowModal(true); setEditingItem(null); resetForm(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + {activeTab === 'models' ? '모델 추가' : '규칙 추가'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 font-medium ${activeTab === 'models' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          모델 설정
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 font-medium ${activeTab === 'safety' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          안전 설정
        </button>
      </div>

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="grid gap-4">
          {configs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">등록된 모델이 없습니다.</div>
          ) : (
            configs.map((config) => (
              <div key={config.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getModelTypeLabel(config.modelType)}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded ${config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {config.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {config.provider} / v{config.modelVersion}
                      {config.baseUrl && <span className="ml-2 text-xs text-gray-400">({config.baseUrl})</span>}
                    </p>
                    {config.validations && config.validations.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        최근 검증: 정확도 {(config.validations[0].accuracy || 0 * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(config, 'model')}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(config.id, 'model')}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === 'safety' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">값</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">우선순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {safetyRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">등록된 규칙이 없습니다.</td>
                </tr>
              ) : (
                safetyRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{getRuleTypeLabel(rule.ruleType)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{rule.ruleValue}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{rule.priority}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(rule, 'safety')} className="text-blue-600 hover:underline mr-3">수정</button>
                      <button onClick={() => handleDelete(rule.id, 'safety')} className="text-red-600 hover:underline">삭제</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? '수정' : '추가'} - {activeTab === 'models' ? '모델' : '안전 규칙'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'models' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">모델 유형</label>
                    <select
                      value={formData.modelType}
                      onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="prediction">광고 성과 예측</option>
                      <option value="copywriting">문구 생성 (LLM)</option>
                      <option value="image_generation">이미지 생성/편집</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">모델 버전</label>
                    <input
                      type="text"
                      value={formData.modelVersion}
                      onChange={(e) => setFormData({ ...formData, modelVersion: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">프로바이더</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value, baseUrl: '', apiKey: '' })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="vllm">vLLM (OpenAI Compatible)</option>
                      <option value="ollama">Ollama (OpenAI Compatible)</option>
                      <option value="custom">Custom (OpenAI Compatible)</option>
                    </select>
                  </div>
                  {['vllm', 'ollama', 'custom'].includes(formData.provider) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Base URL *</label>
                        <input
                          type="url"
                          value={formData.baseUrl}
                          onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                          placeholder="http://localhost:11434/v1"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {formData.provider === 'vllm' && 'vLLM: http://localhost:8000/v1'}
                          {formData.provider === 'ollama' && 'Ollama: http://localhost:11434/v1'}
                          {formData.provider === 'custom' && 'OpenAI 호환 API 엔드포인트 URL'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <input
                          type="password"
                          value={formData.apiKey}
                          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                          placeholder="선택사항 (Ollama는 필요 없음)"
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">규칙 유형</label>
                    <select
                      value={formData.ruleType}
                      onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="forbidden_word">금칙어</option>
                      <option value="brand_guideline">브랜드 가이드라인</option>
                      <option value="ad_policy">광고 정책</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">규칙 값</label>
                    <input
                      type="text"
                      value={formData.ruleValue}
                      onChange={(e) => setFormData({ ...formData, ruleValue: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">우선순위</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm">활성화</label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingItem(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  취소
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

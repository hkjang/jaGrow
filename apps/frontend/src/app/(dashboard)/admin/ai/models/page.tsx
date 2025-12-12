'use client';

import { useState, useEffect } from 'react';

interface AIModelConfig {
  id: string;
  modelType: string;
  modelVersion: string;
  provider: string;
  baseUrl: string | null;
  isActive: boolean;
}

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/settings/ai-models/configs');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'vllm': return '⚡';
      case 'ollama': return '🦙';
      default: return '🔧';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🧠 AI 모델 설정</h1>
          <p className="text-slate-400 mt-1">AI 모델 프로바이더 및 파라미터를 설정합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 모델 추가
        </button>
      </div>

      {/* 프로바이더 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['OpenAI', 'Anthropic', 'vLLM', 'Ollama'].map((provider) => (
          <div key={provider} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="text-3xl mb-3">{getProviderIcon(provider)}</div>
            <h3 className="text-lg font-semibold text-white">{provider}</h3>
            <p className="text-slate-400 text-sm mt-1">
              {models.filter(m => m.provider.toLowerCase() === provider.toLowerCase()).length}개 모델
            </p>
          </div>
        ))}
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
                <th className="px-6 py-4 text-left">모델</th>
                <th className="px-6 py-4 text-left">프로바이더</th>
                <th className="px-6 py-4 text-left">유형</th>
                <th className="px-6 py-4 text-center">상태</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {models.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    등록된 AI 모델이 없습니다.
                  </td>
                </tr>
              ) : (
                models.map((model) => (
                  <tr key={model.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{model.modelVersion}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{getProviderIcon(model.provider)}</span>
                        <span className="text-slate-300">{model.provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{model.modelType}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        model.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {model.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        설정
                      </button>
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

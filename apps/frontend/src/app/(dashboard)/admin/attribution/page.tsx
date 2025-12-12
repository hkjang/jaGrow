'use client';

import { useState, useEffect } from 'react';

interface AttributionModel {
  id: string;
  modelType: string;
  isDefault: boolean;
  config: Record<string, unknown> | null;
}

const modelDescriptions: Record<string, string> = {
  'last_touch': '마지막 접점에 100% 기여도 부여',
  'first_touch': '첫 번째 접점에 100% 기여도 부여',
  'linear': '모든 접점에 균등하게 기여도 분배',
  'time_decay': '전환에 가까운 접점에 더 높은 기여도',
  'data_driven': '데이터 기반 기여도 자동 계산',
};

export default function AttributionPage() {
  const [models, setModels] = useState<AttributionModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/settings/conversions/attribution');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch attribution models:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🔀 어트리뷰션 설정</h1>
          <p className="text-slate-400 mt-1">멀티터치 어트리뷰션 모델을 설정합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 모델 추가
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.length === 0 ? (
            <>
              {/* 기본 모델 카드들 표시 */}
              {Object.entries(modelDescriptions).map(([type, desc]) => (
                <div key={type} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {type.replace('_', ' ')}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-slate-600/20 text-slate-400 rounded-full">
                      미설정
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{desc}</p>
                  <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                    설정하기
                  </button>
                </div>
              ))}
            </>
          ) : (
            models.map((model) => (
              <div key={model.id} className={`bg-slate-800/50 border rounded-xl p-6 transition-colors ${
                model.isDefault ? 'border-blue-500' : 'border-slate-700 hover:border-blue-500/50'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {model.modelType.replace('_', ' ')}
                  </h3>
                  {model.isDefault && (
                    <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full">
                      기본
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  {modelDescriptions[model.modelType] || '커스텀 모델'}
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                    설정
                  </button>
                  {!model.isDefault && (
                    <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors text-sm">
                      기본으로 설정
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface ModelValidation {
  id: string;
  modelConfigId: string;
  accuracy: number | null;
  regressionError: number | null;
  trainedAt: string | null;
  validatedAt: string;
  metrics: Record<string, unknown> | null;
}

export default function AIValidationPage() {
  const [validations, setValidations] = useState<ModelValidation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchValidations();
  }, []);

  const fetchValidations = async () => {
    try {
      const res = await fetch('/api/settings/ai-models/validations');
      if (res.ok) {
        const data = await res.json();
        setValidations(data);
      }
    } catch (error) {
      console.error('Failed to fetch validations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'text-slate-400';
    if (accuracy >= 0.9) return 'text-green-400';
    if (accuracy >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">✅ 모델 검증</h1>
          <p className="text-slate-400 mt-1">AI 모델의 정확도와 성능을 검증합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          검증 실행
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">평균 정확도</p>
          <p className="text-2xl font-bold text-white mt-1">
            {validations.length > 0 && validations.some(v => v.accuracy)
              ? `${(validations.filter(v => v.accuracy).reduce((acc, v) => acc + (v.accuracy || 0), 0) / validations.filter(v => v.accuracy).length * 100).toFixed(1)}%`
              : '-'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">검증된 모델</p>
          <p className="text-2xl font-bold text-white mt-1">{validations.length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">마지막 검증</p>
          <p className="text-2xl font-bold text-white mt-1">
            {validations.length > 0 
              ? new Date(validations[0].validatedAt).toLocaleDateString()
              : '-'}
          </p>
        </div>
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
                <th className="px-6 py-4 text-left">모델 ID</th>
                <th className="px-6 py-4 text-center">정확도</th>
                <th className="px-6 py-4 text-center">회귀 오차</th>
                <th className="px-6 py-4 text-center">훈련 일시</th>
                <th className="px-6 py-4 text-center">검증 일시</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {validations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    검증 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                validations.map((validation) => (
                  <tr key={validation.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-white font-mono text-sm">
                      {validation.modelConfigId.slice(0, 8)}...
                    </td>
                    <td className={`px-6 py-4 text-center ${getAccuracyColor(validation.accuracy)}`}>
                      {validation.accuracy ? `${(validation.accuracy * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-300">
                      {validation.regressionError?.toFixed(4) || '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {validation.trainedAt 
                        ? new Date(validation.trainedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {new Date(validation.validatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        상세
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

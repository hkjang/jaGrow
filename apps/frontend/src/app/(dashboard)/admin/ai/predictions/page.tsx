'use client';

import { useState, useEffect } from 'react';

interface Prediction {
  id: string;
  campaignId: string | null;
  predictionType: string;
  predictedROAS: number;
  predictedSpend: number;
  predictedRevenue: number;
  predictedConversions: number;
  confidenceScore: number;
  createdAt: string;
}

export default function AIPredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/analytics/predictions');
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🔮 성과 예측</h1>
          <p className="text-slate-400 mt-1">AI 기반 ROAS, 전환, CTR 예측을 확인합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          예측 실행
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">예측 ROAS (7일)</p>
          <p className="text-2xl font-bold text-white mt-1">-</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">예측 전환 (7일)</p>
          <p className="text-2xl font-bold text-white mt-1">-</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">예측 지출 (7일)</p>
          <p className="text-2xl font-bold text-white mt-1">-</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">평균 신뢰도</p>
          <p className="text-2xl font-bold text-white mt-1">-</p>
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
                <th className="px-6 py-4 text-left">캠페인</th>
                <th className="px-6 py-4 text-center">기간</th>
                <th className="px-6 py-4 text-right">예측 ROAS</th>
                <th className="px-6 py-4 text-right">예측 전환</th>
                <th className="px-6 py-4 text-right">예측 지출</th>
                <th className="px-6 py-4 text-center">신뢰도</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    예측 데이터가 없습니다. 예측을 실행해주세요.
                  </td>
                </tr>
              ) : (
                predictions.map((prediction) => (
                  <tr key={prediction.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-white">{prediction.campaignId || '전체'}</td>
                    <td className="px-6 py-4 text-center text-slate-400">{prediction.predictionType}</td>
                    <td className="px-6 py-4 text-right text-green-400">
                      {(prediction.predictedROAS * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      {prediction.predictedConversions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      ₩{prediction.predictedSpend.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        prediction.confidenceScore >= 0.8 
                          ? 'bg-green-600/20 text-green-400'
                          : prediction.confidenceScore >= 0.6
                          ? 'bg-yellow-600/20 text-yellow-400'
                          : 'bg-red-600/20 text-red-400'
                      }`}>
                        {(prediction.confidenceScore * 100).toFixed(0)}%
                      </span>
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

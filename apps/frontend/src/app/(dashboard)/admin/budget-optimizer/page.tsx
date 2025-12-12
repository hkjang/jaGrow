'use client';

import { useState, useEffect } from 'react';

interface BudgetAllocation {
  id: string;
  adAccountId: string;
  campaignId: string | null;
  period: string;
  targetROAS: number | null;
  targetCPA: number | null;
  currentBudget: number;
  recommendedBudget: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  allocationScore: number | null;
  isAutoApply: boolean;
}

export default function BudgetOptimizerPage() {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const res = await fetch('/api/ad-integration/budget-allocations');
      if (res.ok) {
        const data = await res.json();
        setAllocations(data);
      }
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">💰 예산 최적화</h1>
          <p className="text-slate-400 mt-1">iROAS 기반 자동 예산 분배를 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          최적화 실행
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">총 예산</p>
          <p className="text-2xl font-bold text-white mt-1">₩0</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">추천 예산</p>
          <p className="text-2xl font-bold text-white mt-1">₩0</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">평균 ROAS</p>
          <p className="text-2xl font-bold text-white mt-1">0%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">자동 적용</p>
          <p className="text-2xl font-bold text-white mt-1">0개</p>
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
                <th className="px-6 py-4 text-left">계정/캠페인</th>
                <th className="px-6 py-4 text-center">기간</th>
                <th className="px-6 py-4 text-right">현재 예산</th>
                <th className="px-6 py-4 text-right">추천 예산</th>
                <th className="px-6 py-4 text-center">점수</th>
                <th className="px-6 py-4 text-center">자동 적용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    예산 할당 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                allocations.map((allocation) => (
                  <tr key={allocation.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-white">{allocation.adAccountId}</td>
                    <td className="px-6 py-4 text-center text-slate-400">{allocation.period}</td>
                    <td className="px-6 py-4 text-right text-white">
                      ₩{allocation.currentBudget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-green-400">
                      {allocation.recommendedBudget ? `₩${allocation.recommendedBudget.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {allocation.allocationScore ? (
                        <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full">
                          {(allocation.allocationScore * 100).toFixed(0)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        allocation.isAutoApply 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {allocation.isAutoApply ? 'ON' : 'OFF'}
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

'use client';

import { useState, useEffect } from 'react';

interface DataQualityRule {
  id: string;
  ruleName: string;
  metricType: string;
  threshold: number;
  alertEnabled: boolean;
}

export default function EventQualityPage() {
  const [rules, setRules] = useState<DataQualityRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/settings/etl/quality-rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Failed to fetch data quality rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'click_id_match_rate': return '클릭 ID 매칭율';
      case 'event_loss_rate': return '이벤트 손실율';
      case 'conversion_delay': return '전환 지연';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 이벤트 품질 모니터링</h1>
          <p className="text-slate-400 mt-1">클릭 ID 매칭율, 이벤트 손실율 등 데이터 품질을 모니터링합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 규칙
        </button>
      </div>

      {/* 품질 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">클릭 ID 매칭율</p>
          <p className="text-2xl font-bold text-green-400 mt-1">98.5%</p>
          <p className="text-xs text-slate-500 mt-1">목표: 95%</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">이벤트 수집율</p>
          <p className="text-2xl font-bold text-green-400 mt-1">99.2%</p>
          <p className="text-xs text-slate-500 mt-1">목표: 98%</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">CAPI 성공율</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">94.1%</p>
          <p className="text-xs text-slate-500 mt-1">목표: 95%</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">평균 지연</p>
          <p className="text-2xl font-bold text-white mt-1">1.2s</p>
          <p className="text-xs text-slate-500 mt-1">목표: &lt;2s</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">품질 규칙</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr className="text-slate-400 text-sm">
                <th className="px-6 py-4 text-left">규칙명</th>
                <th className="px-6 py-4 text-left">지표 유형</th>
                <th className="px-6 py-4 text-center">임계값</th>
                <th className="px-6 py-4 text-center">알림</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    등록된 품질 규칙이 없습니다.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-white">{rule.ruleName}</td>
                    <td className="px-6 py-4 text-slate-400">{getMetricLabel(rule.metricType)}</td>
                    <td className="px-6 py-4 text-center text-white">{(rule.threshold * 100).toFixed(0)}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.alertEnabled 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {rule.alertEnabled ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        편집
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

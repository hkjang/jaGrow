'use client';

import { useState, useEffect } from 'react';

interface AnomalyAlert {
  id: string;
  campaignId: string | null;
  metricType: string;
  alertType: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: string;
  isResolved: boolean;
  createdAt: string;
}

export default function AdsDataQualityPage() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/analytics/anomalies');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Failed to fetch anomaly alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-600/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">📉 광고 데이터 품질</h1>
          <p className="text-slate-400 mt-1">광고 메트릭 이상 탐지 및 품질 검증을 확인합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          이상 탐지 실행
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-6 border ${getSeverityColor('critical')}`}>
          <p className="text-slate-400 text-sm">Critical</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {alerts.filter(a => a.severity === 'critical' && !a.isResolved).length}
          </p>
        </div>
        <div className={`rounded-xl p-6 border ${getSeverityColor('high')}`}>
          <p className="text-slate-400 text-sm">High</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">
            {alerts.filter(a => a.severity === 'high' && !a.isResolved).length}
          </p>
        </div>
        <div className={`rounded-xl p-6 border ${getSeverityColor('medium')}`}>
          <p className="text-slate-400 text-sm">Medium</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {alerts.filter(a => a.severity === 'medium' && !a.isResolved).length}
          </p>
        </div>
        <div className={`rounded-xl p-6 border ${getSeverityColor('low')}`}>
          <p className="text-slate-400 text-sm">Low</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {alerts.filter(a => a.severity === 'low' && !a.isResolved).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">이상 탐지 알림이 없습니다.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`bg-slate-800/50 border rounded-xl p-6 ${
                  alert.isResolved ? 'border-slate-700 opacity-60' : getSeverityColor(alert.severity)
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full uppercase ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-white font-medium">{alert.alertType}</span>
                      {alert.isResolved && (
                        <span className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded-full">
                          해결됨
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">지표: </span>
                        <span className="text-slate-300">{alert.metricType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">현재값: </span>
                        <span className="text-white">{alert.currentValue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">예상값: </span>
                        <span className="text-slate-300">{alert.expectedValue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">편차: </span>
                        <span className={alert.deviation > 0 ? 'text-red-400' : 'text-green-400'}>
                          {alert.deviation > 0 ? '+' : ''}{alert.deviation.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!alert.isResolved && (
                      <button className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                        해결
                      </button>
                    )}
                    <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                      상세
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

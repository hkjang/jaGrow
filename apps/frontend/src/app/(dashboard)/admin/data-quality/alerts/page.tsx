'use client';

import { useState, useEffect } from 'react';

interface AlertRule {
  id: string;
  name: string;
  alertType: string;
  conditions: Record<string, unknown>;
  threshold: number | null;
  isActive: boolean;
}

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/settings/alerts/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Failed to fetch alert rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'budget_depleted': return '예산 소진';
      case 'conversion_drop': return '전환 감소';
      case 'tracking_loss': return '트래킹 손실';
      case 'winner_found': return '승자 발견';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🔔 알림 & 규칙 관리</h1>
          <p className="text-slate-400 mt-1">이상 탐지 알림 및 자동화 규칙을 설정합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 알림 규칙
        </button>
      </div>

      {/* 알림 채널 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Slack', 'Email', 'Webhook', 'In-App'].map((channel) => (
          <div key={channel} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{channel}</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {channel === 'In-App' ? '활성화됨' : '설정 필요'}
                </p>
              </div>
              <span className={`w-3 h-3 rounded-full ${
                channel === 'In-App' ? 'bg-green-500' : 'bg-slate-600'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">등록된 알림 규칙이 없습니다.</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {rule.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">유형: </span>
                        <span className="text-slate-300">{getAlertTypeLabel(rule.alertType)}</span>
                      </div>
                      {rule.threshold && (
                        <div>
                          <span className="text-slate-500">임계값: </span>
                          <span className="text-slate-300">{rule.threshold}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                      테스트
                    </button>
                    <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                      편집
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

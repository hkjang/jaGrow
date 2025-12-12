'use client';

import { useState, useEffect } from 'react';

interface ConversionRule {
  id: string;
  name: string;
  eventType: string;
  conversionValue: number | null;
  deduplicationRule: string | null;
  lookbackWindow: number;
  isActive: boolean;
}

export default function ConversionsPage() {
  const [rules, setRules] = useState<ConversionRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/settings/conversions/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversion rules:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🎯 전환 추적</h1>
          <p className="text-slate-400 mt-1">전환 이벤트 정의 및 중복 제거 규칙을 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 전환 규칙
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">등록된 전환 규칙이 없습니다.</p>
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
                        <span className="text-slate-500">이벤트: </span>
                        <span className="text-slate-300">{rule.eventType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">전환 가치: </span>
                        <span className="text-slate-300">{rule.conversionValue ? `₩${rule.conversionValue.toLocaleString()}` : '미설정'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">룩백 기간: </span>
                        <span className="text-slate-300">{rule.lookbackWindow}일</span>
                      </div>
                      <div>
                        <span className="text-slate-500">중복 제거: </span>
                        <span className="text-slate-300">{rule.deduplicationRule || '미설정'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
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

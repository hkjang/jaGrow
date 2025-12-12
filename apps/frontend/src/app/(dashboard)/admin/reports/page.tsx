'use client';

import { useState, useEffect } from 'react';

interface KpiReport {
  id: string;
  name: string;
  kpiType: string;
  formula: string | null;
  defaultValue: number | null;
  displayUnit: string | null;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<KpiReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/settings/reports/kpis');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">📑 KPI 리포트</h1>
          <p className="text-slate-400 mt-1">KPI 정의 및 리포트 설정을 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 KPI 정의
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">등록된 KPI가 없습니다.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                    <p className="text-slate-400 text-sm mt-1">유형: {report.kpiType}</p>
                    {report.formula && (
                      <p className="text-slate-500 text-sm mt-1 font-mono">{report.formula}</p>
                    )}
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

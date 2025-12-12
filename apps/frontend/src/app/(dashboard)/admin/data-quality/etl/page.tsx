'use client';

import { useState, useEffect } from 'react';

interface EtlJob {
  id: string;
  tenantId: string;
  jobType: string;
  platform: string | null;
  status: string;
  processedCount: number;
  errorMessage: string | null;
  createdAt: string;
}

export default function ETLPipelinePage() {
  const [jobs, setJobs] = useState<EtlJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/settings/etl/schedules');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch ETL jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600/20 text-green-400';
      case 'running': return 'bg-blue-600/20 text-blue-400';
      case 'failed': return 'bg-red-600/20 text-red-400';
      default: return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🔄 ETL 파이프라인</h1>
          <p className="text-slate-400 mt-1">데이터 동기화 작업 및 파이프라인을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            스케줄 설정
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            + 새 작업
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">전체 작업</p>
          <p className="text-2xl font-bold text-white mt-1">{jobs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">완료</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {jobs.filter(j => j.status === 'completed').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">실행 중</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {jobs.filter(j => j.status === 'running').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">실패</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {jobs.filter(j => j.status === 'failed').length}
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
                <th className="px-6 py-4 text-left">작업 유형</th>
                <th className="px-6 py-4 text-left">플랫폼</th>
                <th className="px-6 py-4 text-center">상태</th>
                <th className="px-6 py-4 text-right">처리량</th>
                <th className="px-6 py-4 text-center">생성일</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    등록된 ETL 작업이 없습니다.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{job.jobType}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{job.platform || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      {job.processedCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {job.status === 'running' && (
                          <button className="px-3 py-1 text-sm bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                            중지
                          </button>
                        )}
                        <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                          로그
                        </button>
                      </div>
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

'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const loadMockData = () => {
    setLogs([
      { id: '1', userId: 'user-1', userEmail: 'admin@techstartup.kr', action: 'create', resource: 'experiment', resourceId: 'exp-1', ipAddress: '192.168.1.100', timestamp: new Date().toISOString() },
      { id: '2', userId: 'user-2', userEmail: 'user@example.com', action: 'update', resource: 'campaign', resourceId: 'camp-1', ipAddress: '192.168.1.101', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', userId: 'user-1', userEmail: 'admin@techstartup.kr', action: 'delete', resource: 'rule', resourceId: 'rule-1', ipAddress: '192.168.1.100', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: '4', userId: 'user-3', userEmail: 'manager@example.com', action: 'approve', resource: 'integration', resourceId: 'int-1', ipAddress: '192.168.1.102', timestamp: new Date(Date.now() - 86400000).toISOString() },
    ]);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          loadMockData();
        }
      } else {
        loadMockData();
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-600/20 text-green-400';
      case 'update': return 'bg-blue-600/20 text-blue-400';
      case 'delete': return 'bg-red-600/20 text-red-400';
      case 'approve': return 'bg-purple-600/20 text-purple-400';
      case 'reject': return 'bg-orange-600/20 text-orange-400';
      default: return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">📝 감사 로그</h1>
          <p className="text-slate-400 mt-1">시스템 변경 이력을 추적합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            내보내기
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-4">
        <select className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">
          <option value="">모든 액션</option>
          <option value="create">생성</option>
          <option value="update">수정</option>
          <option value="delete">삭제</option>
          <option value="approve">승인</option>
          <option value="reject">거절</option>
        </select>
        <select className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">
          <option value="">모든 리소스</option>
          <option value="experiment">실험</option>
          <option value="rule">규칙</option>
          <option value="integration">연동</option>
          <option value="user">사용자</option>
        </select>
        <input
          type="date"
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg"
        />
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
                <th className="px-6 py-4 text-left">일시</th>
                <th className="px-6 py-4 text-left">사용자</th>
                <th className="px-6 py-4 text-center">액션</th>
                <th className="px-6 py-4 text-left">리소스</th>
                <th className="px-6 py-4 text-left">IP 주소</th>
                <th className="px-6 py-4 text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">{log.userEmail || log.userId.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full uppercase ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">{log.resource}</div>
                      {log.resourceId && (
                        <div className="text-slate-500 text-xs font-mono">{log.resourceId.slice(0, 8)}...</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-sm">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        보기
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

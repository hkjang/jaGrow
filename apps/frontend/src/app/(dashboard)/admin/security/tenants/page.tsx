'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Tenant {
  id: string;
  name: string;
  orgId: string;
  plan: string;
  apiKey: string;
  eventsCount: number;
  storageBytes: number;
  costEstimate: number;
  isActive: boolean;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const loadMockData = () => {
    setTenants([
      { id: '1', name: '테크스타트업', orgId: 'org-1', plan: 'enterprise', apiKey: 'api-***', eventsCount: 1250000, storageBytes: 5368709120, costEstimate: 850000, isActive: true },
      { id: '2', name: '디지털마케팅', orgId: 'org-2', plan: 'pro', apiKey: 'api-***', eventsCount: 450000, storageBytes: 2147483648, costEstimate: 350000, isActive: true },
      { id: '3', name: '이커머스허브', orgId: 'org-3', plan: 'pro', apiKey: 'api-***', eventsCount: 890000, storageBytes: 3221225472, costEstimate: 520000, isActive: true },
    ]);
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/tenants`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      } else {
        console.error('Failed to fetch tenants:', res.status);
        loadMockData();
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-600/20 text-purple-400';
      case 'pro': return 'bg-blue-600/20 text-blue-400';
      default: return 'bg-slate-600/20 text-slate-400';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🏢 테넌트 관리</h1>
          <p className="text-slate-400 mt-1">멀티테넌트 환경을 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 테넌트
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">전체 테넌트</p>
          <p className="text-2xl font-bold text-white mt-1">{tenants.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">활성 테넌트</p>
          <p className="text-2xl font-bold text-white mt-1">{tenants.filter(t => t.isActive).length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">Enterprise</p>
          <p className="text-2xl font-bold text-white mt-1">{tenants.filter(t => t.plan === 'enterprise').length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">총 비용 추정</p>
          <p className="text-2xl font-bold text-white mt-1">
            ₩{tenants.reduce((sum, t) => sum + t.costEstimate, 0).toLocaleString()}
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
                <th className="px-6 py-4 text-left">테넌트명</th>
                <th className="px-6 py-4 text-center">플랜</th>
                <th className="px-6 py-4 text-right">이벤트 수</th>
                <th className="px-6 py-4 text-right">스토리지</th>
                <th className="px-6 py-4 text-right">비용 추정</th>
                <th className="px-6 py-4 text-center">상태</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    등록된 테넌트가 없습니다.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{tenant.name}</div>
                      <div className="text-slate-500 text-xs">{tenant.orgId}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getPlanColor(tenant.plan)}`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      {Number(tenant.eventsCount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      {formatBytes(Number(tenant.storageBytes))}
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      ₩{tenant.costEstimate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tenant.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {tenant.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        관리
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

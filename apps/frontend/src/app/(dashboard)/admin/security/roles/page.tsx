'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AdminRole {
  id: string;
  userId: string;
  roleType: string;
  grantedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  permissions?: { resource: string; action: string }[];
}

const roleDescriptions: Record<string, string> = {
  'SUPER_ADMIN': '모든 시스템 권한',
  'ORG_ADMIN': '조직 관리 권한',
  'DATA_OPS': '데이터 운영 권한',
  'AD_OPS': '광고 운영 권한',
  'PRODUCT_OWNER': '제품 관리 권한',
  'AUDITOR': '감사 조회 권한',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/roles`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      } else {
        console.error('Failed to fetch roles:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">👤 권한 관리</h1>
          <p className="text-slate-400 mt-1">RBAC 기반 역할 및 권한을 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 역할 할당
        </button>
      </div>

      {/* 역할 유형 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(roleDescriptions).map(([role, desc]) => (
          <div key={role} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition-colors">
            <h3 className="text-sm font-semibold text-white">{role}</h3>
            <p className="text-slate-400 text-xs mt-1">{desc}</p>
            <p className="text-blue-400 text-xs mt-2">
              {roles.filter(r => r.roleType === role && r.isActive).length}명
            </p>
          </div>
        ))}
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
                <th className="px-6 py-4 text-left">사용자 ID</th>
                <th className="px-6 py-4 text-left">역할</th>
                <th className="px-6 py-4 text-center">상태</th>
                <th className="px-6 py-4 text-center">부여일</th>
                <th className="px-6 py-4 text-center">만료일</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    할당된 역할이 없습니다.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-white font-mono text-sm">
                      {role.userId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full">
                        {role.roleType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        role.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {role.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {new Date(role.grantedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {role.expiresAt ? new Date(role.expiresAt).toLocaleDateString() : '-'}
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

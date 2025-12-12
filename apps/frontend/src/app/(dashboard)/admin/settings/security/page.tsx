'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SecuritySettingsPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policies' | 'apikeys'>('policies');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        fetch(`${API_BASE}/settings/security/access-policies`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/settings/security/api-keys`).then(r => r.ok ? r.json() : []),
      ]);
      setPolicies(p); setApiKeys(a);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = activeTab === 'policies' ? 'access-policies' : 'api-keys';
    const url = `${API_BASE}/settings/security/${ep}${editingItem ? `/${editingItem.id}` : ''}`;
    await fetch(url, { method: editingItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    fetchData(); setShowModal(false); setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제?')) return;
    const ep = activeTab === 'policies' ? 'access-policies' : 'api-keys';
    await fetch(`${API_BASE}/settings/security/${ep}/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const regenerateKey = async (id: string) => {
    if (!confirm('API 키를 재발급하시겠습니까?')) return;
    await fetch(`${API_BASE}/settings/security/api-keys/${id}/regenerate`, { method: 'POST' });
    fetchData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">권한·보안 설정</h1>
        <button onClick={() => { setShowModal(true); setEditingItem(null); setFormData(activeTab === 'policies' ? { policyType: 'ip_whitelist', isActive: true } : { permissions: [], isActive: true }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ 추가</button>
      </div>

      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab('policies')} className={`px-4 py-2 ${activeTab === 'policies' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>접근 정책</button>
        <button onClick={() => setActiveTab('apikeys')} className={`px-4 py-2 ${activeTab === 'apikeys' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>API 키</button>
      </div>

      {activeTab === 'policies' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="px-4 py-3 text-left text-xs">유형</th><th className="px-4 py-3 text-left text-xs">IP 범위</th><th className="px-4 py-3 text-left text-xs">설명</th><th className="px-4 py-3 text-left text-xs">상태</th><th className="px-4 py-3 text-right text-xs">액션</th></tr>
            </thead>
            <tbody className="divide-y">
              {policies.map(p => (
                <tr key={p.id}><td className="px-4 py-3 text-sm">{p.policyType === 'ip_whitelist' ? '화이트리스트' : '블랙리스트'}</td><td className="px-4 py-3 text-sm font-mono">{p.ipRange}</td><td className="px-4 py-3 text-sm">{p.description || '-'}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{p.isActive ? '활성' : '비활성'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(p); setFormData(p); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(p.id)} className="text-red-600">삭제</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'apikeys' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="px-4 py-3 text-left text-xs">이름</th><th className="px-4 py-3 text-left text-xs">API 키</th><th className="px-4 py-3 text-left text-xs">권한</th><th className="px-4 py-3 text-left text-xs">상태</th><th className="px-4 py-3 text-right text-xs">액션</th></tr>
            </thead>
            <tbody className="divide-y">
              {apiKeys.map(k => (
                <tr key={k.id}><td className="px-4 py-3 text-sm font-medium">{k.keyName}</td><td className="px-4 py-3 text-sm font-mono text-gray-500">{k.apiKey?.substring(0, 8)}...</td><td className="px-4 py-3 text-sm">{k.permissions?.length || 0}개</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${k.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{k.isActive ? '활성' : '비활성'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => regenerateKey(k.id)} className="text-green-600 mr-2">재발급</button><button onClick={() => { setEditingItem(k); setFormData(k); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(k.id)} className="text-red-600">삭제</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingItem ? '수정' : '추가'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'policies' && <>
                <select value={formData.policyType || 'ip_whitelist'} onChange={e => setFormData({...formData, policyType: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="ip_whitelist">화이트리스트</option><option value="ip_blacklist">블랙리스트</option></select>
                <input type="text" placeholder="IP 범위 (예: 192.168.1.0/24)" value={formData.ipRange || ''} onChange={e => setFormData({...formData, ipRange: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <input type="text" placeholder="설명 (선택)" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </>}
              {activeTab === 'apikeys' && <>
                <input type="text" placeholder="키 이름" value={formData.keyName || ''} onChange={e => setFormData({...formData, keyName: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <input type="text" placeholder="권한 (쉼표 구분)" value={formData.permissions?.join(',') || ''} onChange={e => setFormData({...formData, permissions: e.target.value.split(',').filter(Boolean)})} className="w-full px-3 py-2 border rounded" />
              </>}
              <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive !== false} onChange={e => setFormData({...formData, isActive: e.target.checked})} /><label className="text-sm">활성화</label></div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AlertSettingsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [automation, setAutomation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'automation'>('rules');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        fetch(`${API_BASE}/settings/alerts/rules`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/settings/alerts/automation`).then(r => r.ok ? r.json() : []),
      ]);
      setRules(r); setAutomation(a);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = activeTab === 'rules' ? 'rules' : 'automation';
    const url = `${API_BASE}/settings/alerts/${ep}${editingItem ? `/${editingItem.id}` : ''}`;
    await fetch(url, { method: editingItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    fetchData(); setShowModal(false); setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제?')) return;
    const ep = activeTab === 'rules' ? 'rules' : 'automation';
    await fetch(`${API_BASE}/settings/alerts/${ep}/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const getAlertTypeLabel = (t: string) => ({ budget_depleted: '예산 소진', conversion_drop: '전환 급감', tracking_loss: '트래킹 누락', winner_found: '실험 승자' }[t] || t);
  const getRuleTypeLabel = (t: string) => ({ campaign_pause: '캠페인 중지', budget_increase: '예산 증가', budget_decrease: '예산 감소', kpi_switch: 'KPI 전환' }[t] || t);

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">알림·자동화 설정</h1>
        <button onClick={() => { setShowModal(true); setEditingItem(null); setFormData(activeTab === 'rules' ? { alertType: 'budget_depleted', conditions: {}, isActive: true } : { ruleType: 'campaign_pause', triggerConditions: {}, actions: {}, isActive: true }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ 추가</button>
      </div>

      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab('rules')} className={`px-4 py-2 ${activeTab === 'rules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>알림 규칙</button>
        <button onClick={() => setActiveTab('automation')} className={`px-4 py-2 ${activeTab === 'automation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>자동화 규칙</button>
      </div>

      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="px-4 py-3 text-left text-xs">이름</th><th className="px-4 py-3 text-left text-xs">알림 유형</th><th className="px-4 py-3 text-left text-xs">임계치</th><th className="px-4 py-3 text-left text-xs">상태</th><th className="px-4 py-3 text-right text-xs">액션</th></tr>
            </thead>
            <tbody className="divide-y">
              {rules.map(r => (
                <tr key={r.id}><td className="px-4 py-3 text-sm font-medium">{r.name}</td><td className="px-4 py-3 text-sm">{getAlertTypeLabel(r.alertType)}</td><td className="px-4 py-3 text-sm">{r.threshold || '-'}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{r.isActive ? '활성' : '비활성'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(r); setFormData(r); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(r.id)} className="text-red-600">삭제</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="px-4 py-3 text-left text-xs">이름</th><th className="px-4 py-3 text-left text-xs">규칙 유형</th><th className="px-4 py-3 text-left text-xs">실행 횟수</th><th className="px-4 py-3 text-left text-xs">상태</th><th className="px-4 py-3 text-right text-xs">액션</th></tr>
            </thead>
            <tbody className="divide-y">
              {automation.map(a => (
                <tr key={a.id}><td className="px-4 py-3 text-sm font-medium">{a.name}</td><td className="px-4 py-3 text-sm">{getRuleTypeLabel(a.ruleType)}</td><td className="px-4 py-3 text-sm">{a.triggerCount}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{a.isActive ? '활성' : '비활성'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(a); setFormData(a); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(a.id)} className="text-red-600">삭제</button></td></tr>
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
              <input type="text" placeholder="이름" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded" required />
              {activeTab === 'rules' && <>
                <select value={formData.alertType || 'budget_depleted'} onChange={e => setFormData({...formData, alertType: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="budget_depleted">예산 소진</option><option value="conversion_drop">전환 급감</option><option value="tracking_loss">트래킹 누락</option><option value="winner_found">실험 승자</option></select>
                <input type="number" placeholder="임계치" value={formData.threshold || ''} onChange={e => setFormData({...formData, threshold: parseFloat(e.target.value)})} className="w-full px-3 py-2 border rounded" />
              </>}
              {activeTab === 'automation' && <>
                <select value={formData.ruleType || 'campaign_pause'} onChange={e => setFormData({...formData, ruleType: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="campaign_pause">캠페인 중지</option><option value="budget_increase">예산 증가</option><option value="budget_decrease">예산 감소</option><option value="kpi_switch">KPI 전환</option></select>
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

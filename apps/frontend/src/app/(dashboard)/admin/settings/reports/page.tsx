'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ReportSettingsPage() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kpis' | 'templates' | 'schedules'>('kpis');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [k, t, s] = await Promise.all([
        fetch(`${API_BASE}/settings/reports/kpis`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/settings/reports/dashboard-templates`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/settings/reports/schedules`).then(r => r.ok ? r.json() : []),
      ]);
      setKpis(k); setTemplates(t); setSchedules(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = { kpis: 'kpis', templates: 'dashboard-templates', schedules: 'schedules' }[activeTab];
    const url = `${API_BASE}/settings/reports/${ep}${editingItem ? `/${editingItem.id}` : ''}`;
    await fetch(url, { method: editingItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    fetchData(); setShowModal(false); setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제?')) return;
    const ep = { kpis: 'kpis', templates: 'dashboard-templates', schedules: 'schedules' }[activeTab];
    await fetch(`${API_BASE}/settings/reports/${ep}/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const setDefault = async (id: string) => {
    await fetch(`${API_BASE}/settings/reports/dashboard-templates/${id}/default`, { method: 'PUT' });
    fetchData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">보고서·대시보드 설정</h1>
        <button onClick={() => { setShowModal(true); setEditingItem(null); setFormData({}); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ 추가</button>
      </div>

      <div className="flex border-b mb-6">
        {['kpis', 'templates', 'schedules'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            {t === 'kpis' ? 'KPI 정의' : t === 'templates' ? '대시보드 템플릿' : '리포트 스케줄'}
          </button>
        ))}
      </div>

      {activeTab === 'kpis' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="px-4 py-3 text-left text-xs">이름</th><th className="px-4 py-3 text-left text-xs">유형</th><th className="px-4 py-3 text-left text-xs">공식</th><th className="px-4 py-3 text-left text-xs">기본값</th><th className="px-4 py-3 text-right text-xs">액션</th></tr>
            </thead>
            <tbody className="divide-y">
              {kpis.map(k => (
                <tr key={k.id}><td className="px-4 py-3 text-sm">{k.name}</td><td className="px-4 py-3 text-sm">{k.kpiType}</td><td className="px-4 py-3 text-sm">{k.formula || '-'}</td><td className="px-4 py-3 text-sm">{k.defaultValue || '-'}</td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(k); setFormData(k); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(k.id)} className="text-red-600">삭제</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <div key={t.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${t.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex justify-between mb-2"><h3 className="font-semibold">{t.name}</h3>{t.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">기본값</span>}</div>
              <p className="text-sm text-gray-500">색상: {t.colorScheme}</p>
              <div className="flex gap-2 mt-4">
                {!t.isDefault && <button onClick={() => setDefault(t.id)} className="text-green-600 text-sm">기본값 설정</button>}
                <button onClick={() => { setEditingItem(t); setFormData(t); setShowModal(true); }} className="text-blue-600 text-sm">수정</button>
                <button onClick={() => handleDelete(t.id)} className="text-red-600 text-sm">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="px-4 py-3 text-left text-xs">이름</th><th className="px-4 py-3 text-left text-xs">주기</th><th className="px-4 py-3 text-left text-xs">형식</th><th className="px-4 py-3 text-left text-xs">상태</th><th className="px-4 py-3 text-right text-xs">액션</th></tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map(s => (
                <tr key={s.id}><td className="px-4 py-3 text-sm">{s.reportName}</td><td className="px-4 py-3 text-sm">{s.frequency}</td><td className="px-4 py-3 text-sm">{s.format}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{s.isActive ? '활성' : '비활성'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(s); setFormData(s); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(s.id)} className="text-red-600">삭제</button></td></tr>
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
              {activeTab === 'kpis' && <>
                <input type="text" placeholder="이름" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <select value={formData.kpiType || 'roas'} onChange={e => setFormData({...formData, kpiType: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="roas">ROAS</option><option value="cac">CAC</option><option value="ltv">LTV</option><option value="conversion_rate">전환율</option></select>
                <input type="text" placeholder="공식 (선택)" value={formData.formula || ''} onChange={e => setFormData({...formData, formula: e.target.value})} className="w-full px-3 py-2 border rounded" />
                <input type="number" placeholder="기본값" value={formData.defaultValue || ''} onChange={e => setFormData({...formData, defaultValue: parseFloat(e.target.value)})} className="w-full px-3 py-2 border rounded" />
              </>}
              {activeTab === 'templates' && <>
                <input type="text" placeholder="이름" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <select value={formData.colorScheme || 'light'} onChange={e => setFormData({...formData, colorScheme: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="light">Light</option><option value="dark">Dark</option></select>
              </>}
              {activeTab === 'schedules' && <>
                <input type="text" placeholder="리포트 이름" value={formData.reportName || ''} onChange={e => setFormData({...formData, reportName: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <select value={formData.frequency || 'daily'} onChange={e => setFormData({...formData, frequency: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="daily">일간</option><option value="weekly">주간</option><option value="realtime">실시간</option></select>
                <select value={formData.format || 'pdf'} onChange={e => setFormData({...formData, format: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option></select>
              </>}
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

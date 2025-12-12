'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function EtlSettingsPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [qualityRules, setQualityRules] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedules' | 'quality' | 'storage'>('schedules');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, q, p] = await Promise.all([
        fetch(`${API_BASE}/settings/etl/schedules`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/settings/etl/quality-rules`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/settings/etl/storage-policies`).then(r => r.ok ? r.json() : []),
      ]);
      setSchedules(s); setQualityRules(q); setPolicies(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = { schedules: 'schedules', quality: 'quality-rules', storage: 'storage-policies' }[activeTab];
    const url = `${API_BASE}/settings/etl/${ep}${editingItem ? `/${editingItem.id}` : ''}`;
    await fetch(url, { method: editingItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    fetchData(); setShowModal(false); setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제?')) return;
    const ep = { schedules: 'schedules', quality: 'quality-rules', storage: 'storage-policies' }[activeTab];
    await fetch(`${API_BASE}/settings/etl/${ep}/${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">ETL·데이터 처리 설정</h1>
        <button onClick={() => { setShowModal(true); setEditingItem(null); setFormData({}); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ 추가</button>
      </div>

      <div className="flex border-b mb-6">
        {['schedules', 'quality', 'storage'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            {t === 'schedules' ? '스케줄' : t === 'quality' ? '품질 규칙' : '스토리지'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {activeTab === 'schedules' && <><th className="px-4 py-3 text-left text-xs">작업명</th><th className="px-4 py-3 text-left text-xs">유형</th><th className="px-4 py-3 text-left text-xs">값</th><th className="px-4 py-3 text-left text-xs">상태</th></>}
              {activeTab === 'quality' && <><th className="px-4 py-3 text-left text-xs">규칙명</th><th className="px-4 py-3 text-left text-xs">지표</th><th className="px-4 py-3 text-left text-xs">임계치</th><th className="px-4 py-3 text-left text-xs">알림</th></>}
              {activeTab === 'storage' && <><th className="px-4 py-3 text-left text-xs">테이블</th><th className="px-4 py-3 text-left text-xs">파티션</th><th className="px-4 py-3 text-left text-xs">보관</th><th className="px-4 py-3 text-left text-xs">압축</th></>}
              <th className="px-4 py-3 text-right text-xs">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeTab === 'schedules' && schedules.map(s => (
              <tr key={s.id}><td className="px-4 py-3 text-sm">{s.jobName}</td><td className="px-4 py-3 text-sm">{s.scheduleType}</td><td className="px-4 py-3 text-sm">{s.cronExpression || `${s.retentionDays}일`}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{s.isActive ? '활성' : '비활성'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(s); setFormData(s); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(s.id)} className="text-red-600">삭제</button></td></tr>
            ))}
            {activeTab === 'quality' && qualityRules.map(r => (
              <tr key={r.id}><td className="px-4 py-3 text-sm">{r.ruleName}</td><td className="px-4 py-3 text-sm">{r.metricType}</td><td className="px-4 py-3 text-sm">{(r.threshold * 100).toFixed(0)}%</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${r.alertEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{r.alertEnabled ? 'ON' : 'OFF'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(r); setFormData(r); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(r.id)} className="text-red-600">삭제</button></td></tr>
            ))}
            {activeTab === 'storage' && policies.map(p => (
              <tr key={p.id}><td className="px-4 py-3 text-sm">{p.tableName}</td><td className="px-4 py-3 text-sm">{p.partitionBy}</td><td className="px-4 py-3 text-sm">{p.retentionYears}년</td><td className="px-4 py-3 text-sm">{p.compressAfterDays ? `${p.compressAfterDays}일` : '-'}</td><td className="px-4 py-3 text-right"><button onClick={() => { setEditingItem(p); setFormData(p); setShowModal(true); }} className="text-blue-600 mr-2">수정</button><button onClick={() => handleDelete(p.id)} className="text-red-600">삭제</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingItem ? '수정' : '추가'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'schedules' && <>
                <input type="text" placeholder="작업명" value={formData.jobName || ''} onChange={e => setFormData({...formData, jobName: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <select value={formData.scheduleType || 'batch'} onChange={e => setFormData({...formData, scheduleType: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="batch">배치</option><option value="stream">스트림</option></select>
                <input type="text" placeholder="크론 (0 * * * *)" value={formData.cronExpression || ''} onChange={e => setFormData({...formData, cronExpression: e.target.value})} className="w-full px-3 py-2 border rounded" />
                <input type="number" placeholder="리텐션(일)" value={formData.retentionDays || 30} onChange={e => setFormData({...formData, retentionDays: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded" />
              </>}
              {activeTab === 'quality' && <>
                <input type="text" placeholder="규칙명" value={formData.ruleName || ''} onChange={e => setFormData({...formData, ruleName: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <select value={formData.metricType || 'click_id_match_rate'} onChange={e => setFormData({...formData, metricType: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="click_id_match_rate">클릭ID매칭률</option><option value="event_loss_rate">이벤트누락률</option></select>
                <input type="number" step="0.01" min="0" max="1" placeholder="임계치" value={formData.threshold || 0.9} onChange={e => setFormData({...formData, threshold: parseFloat(e.target.value)})} className="w-full px-3 py-2 border rounded" />
              </>}
              {activeTab === 'storage' && <>
                <input type="text" placeholder="테이블명" value={formData.tableName || ''} onChange={e => setFormData({...formData, tableName: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <select value={formData.partitionBy || 'date'} onChange={e => setFormData({...formData, partitionBy: e.target.value})} className="w-full px-3 py-2 border rounded"><option value="date">일별</option><option value="month">월별</option><option value="year">연별</option></select>
                <select value={formData.retentionYears || 1} onChange={e => setFormData({...formData, retentionYears: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded"><option value={1}>1년</option><option value={3}>3년</option><option value={5}>5년</option></select>
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

'use client';

import { useState, useEffect } from 'react';

interface Segment {
  id: string;
  name: string;
  ruleType: string;
  conditions: Record<string, unknown>;
  autoGenerate: boolean;
  isActive: boolean;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'behavior',
    conditions: {},
    autoGenerate: false,
    isActive: true,
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const res = await fetch('/api/settings/segments/rules');
      if (res.ok) {
        const data = await res.json();
        setSegments(data);
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSegment 
        ? `/api/settings/segments/rules/${editingSegment.id}`
        : '/api/settings/segments/rules';
      const method = editingSegment ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        fetchSegments();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save segment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/settings/segments/rules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSegments();
      }
    } catch (error) {
      console.error('Failed to delete segment:', error);
    }
  };

  const openCreateModal = () => {
    setEditingSegment(null);
    setFormData({ name: '', ruleType: 'behavior', conditions: {}, autoGenerate: false, isActive: true });
    setShowModal(true);
  };

  const openEditModal = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      ruleType: segment.ruleType,
      conditions: segment.conditions,
      autoGenerate: segment.autoGenerate,
      isActive: segment.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSegment(null);
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'behavior': return '행동 기반';
      case 'time': return '시간 기반';
      case 'value': return '가치 기반';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 세그먼트/오디언스</h1>
          <p className="text-slate-400 mt-1">사용자 세그먼트를 정의하고 광고 플랫폼과 동기화합니다.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          + 새 세그먼트
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">전체 세그먼트</p>
          <p className="text-2xl font-bold text-white mt-1">{segments.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">활성 세그먼트</p>
          <p className="text-2xl font-bold text-white mt-1">{segments.filter(s => s.isActive).length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
          <p className="text-slate-400 text-sm">자동 생성</p>
          <p className="text-2xl font-bold text-white mt-1">{segments.filter(s => s.autoGenerate).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {segments.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">등록된 세그먼트가 없습니다.</p>
            </div>
          ) : (
            segments.map((segment) => (
              <div key={segment.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{segment.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        segment.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {segment.isActive ? '활성' : '비활성'}
                      </span>
                      {segment.autoGenerate && (
                        <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-400 rounded-full">
                          자동
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-slate-400">
                        규칙 유형: <span className="text-slate-300">{getRuleTypeLabel(segment.ruleType)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(segment)}
                      className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      편집
                    </button>
                    <button 
                      onClick={() => handleDelete(segment.id)}
                      className="px-3 py-1 text-sm text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingSegment ? '세그먼트 편집' : '새 세그먼트'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">규칙 유형</label>
                <select
                  value={formData.ruleType}
                  onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg"
                >
                  <option value="behavior">행동 기반</option>
                  <option value="time">시간 기반</option>
                  <option value="value">가치 기반</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  활성화
                </label>
                <label className="flex items-center gap-2 text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.autoGenerate}
                    onChange={(e) => setFormData({ ...formData, autoGenerate: e.target.checked })}
                    className="w-4 h-4"
                  />
                  자동 생성
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingSegment ? '저장' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


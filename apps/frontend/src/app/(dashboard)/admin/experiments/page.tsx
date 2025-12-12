'use client';

import { useState, useEffect } from 'react';

interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'ENDED';
  trafficAllocation: number;
  createdAt: string;
  updatedAt?: string;
}

const API_URL = 'http://localhost:4000';

const statusConfig = {
  DRAFT: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Draft' },
  RUNNING: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Running' },
  PAUSED: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Paused' },
  ENDED: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Ended' },
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingExp, setEditingExp] = useState<Experiment | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    status: 'DRAFT',
    trafficAllocation: 50
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/experiments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExperiments(data);
      } else {
        loadMockData();
      }
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setExperiments([
      { id: '1', name: 'New Checkout Flow', description: '새로운 결제 플로우 테스트', status: 'RUNNING', trafficAllocation: 50, createdAt: '2024-12-01' },
      { id: '2', name: 'Homepage Hero Banner', description: '메인 페이지 배너 A/B 테스트', status: 'RUNNING', trafficAllocation: 30, createdAt: '2024-12-05' },
      { id: '3', name: 'CTA Button Color', description: 'CTA 버튼 색상 테스트', status: 'PAUSED', trafficAllocation: 25, createdAt: '2024-11-20' },
      { id: '4', name: 'Pricing Page Layout', description: '가격 페이지 레이아웃 변경', status: 'ENDED', trafficAllocation: 100, createdAt: '2024-11-01' },
      { id: '5', name: 'Mobile Navigation', description: '모바일 네비게이션 개선', status: 'DRAFT', trafficAllocation: 20, createdAt: '2024-12-10' },
    ]);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', description: '', status: 'DRAFT', trafficAllocation: 50 });
    setEditingExp(null);
    setShowModal(true);
  };

  const openEditModal = (exp: Experiment) => {
    setModalMode('edit');
    setFormData({ 
      name: exp.name, 
      description: exp.description || '',
      status: exp.status,
      trafficAllocation: exp.trafficAllocation
    });
    setEditingExp(exp);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('실험 이름을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      if (modalMode === 'create') {
        const response = await fetch('/api/experiments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const newExp = await response.json();
          setExperiments([...experiments, newExp]);
        } else {
          // Mock create
          const newExp: Experiment = {
            id: Date.now().toString(),
            name: formData.name,
            description: formData.description,
            status: formData.status as Experiment['status'],
            trafficAllocation: formData.trafficAllocation,
            createdAt: new Date().toISOString().split('T')[0]
          };
          setExperiments([...experiments, newExp]);
        }
      } else if (editingExp) {
        const response = await fetch(`/api/experiments/${editingExp.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const updatedExp = await response.json();
          setExperiments(experiments.map(e => e.id === editingExp.id ? updatedExp : e));
        } else {
          // Mock update
          setExperiments(experiments.map(e => 
            e.id === editingExp.id 
              ? { ...e, ...formData, status: formData.status as Experiment['status'] } 
              : e
          ));
        }
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save experiment:', error);
      // Mock save
      if (modalMode === 'create') {
        const newExp: Experiment = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          status: formData.status as Experiment['status'],
          trafficAllocation: formData.trafficAllocation,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setExperiments([...experiments, newExp]);
      } else if (editingExp) {
        setExperiments(experiments.map(e => 
          e.id === editingExp.id 
            ? { ...e, ...formData, status: formData.status as Experiment['status'] } 
            : e
        ));
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/experiments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to delete experiment:', error);
    }
    setExperiments(experiments.filter(e => e.id !== id));
    setShowDeleteConfirm(null);
  };

  const updateStatus = (exp: Experiment, newStatus: Experiment['status']) => {
    setExperiments(experiments.map(e => 
      e.id === exp.id ? { ...e, status: newStatus } : e
    ));
  };

  const filteredExperiments = experiments.filter(e => 
    statusFilter === 'all' || e.status === statusFilter
  );

  const getStatusCounts = () => ({
    RUNNING: experiments.filter(e => e.status === 'RUNNING').length,
    PAUSED: experiments.filter(e => e.status === 'PAUSED').length,
    DRAFT: experiments.filter(e => e.status === 'DRAFT').length,
    ENDED: experiments.filter(e => e.status === 'ENDED').length,
  });

  const counts = getStatusCounts();

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Experiments</h1>
          <p className="text-slate-400 mt-1">Manage A/B tests and experiments</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
        >
          + Create Experiment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Running</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{counts.RUNNING}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Paused</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{counts.PAUSED}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Draft</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{counts.DRAFT}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Ended</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{counts.ENDED}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['all', 'RUNNING', 'PAUSED', 'DRAFT', 'ENDED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {status === 'all' ? 'All' : status.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Experiments List */}
      <div className="space-y-4">
        {filteredExperiments.map((exp) => (
          <div
            key={exp.id}
            className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{exp.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[exp.status].bg} ${statusConfig[exp.status].text}`}>
                    {statusConfig[exp.status].label}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-slate-400 text-sm mb-2">{exp.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span>Traffic: {exp.trafficAllocation}%</span>
                  <span>•</span>
                  <span>Created: {exp.createdAt}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {exp.status === 'DRAFT' && (
                  <button 
                    onClick={() => updateStatus(exp, 'RUNNING')}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    ▶ Start
                  </button>
                )}
                {exp.status === 'RUNNING' && (
                  <button 
                    onClick={() => updateStatus(exp, 'PAUSED')}
                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                  >
                    ⏸ Pause
                  </button>
                )}
                {exp.status === 'PAUSED' && (
                  <>
                    <button 
                      onClick={() => updateStatus(exp, 'RUNNING')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      ▶ Resume
                    </button>
                    <button 
                      onClick={() => updateStatus(exp, 'ENDED')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      ⬛ End
                    </button>
                  </>
                )}
                <button 
                  onClick={() => openEditModal(exp)}
                  className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(exp.id)}
                  className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {modalMode === 'create' ? 'Create Experiment' : 'Edit Experiment'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Experiment Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="예: Homepage Hero Test"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                  placeholder="실험에 대한 설명"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Traffic Allocation (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.trafficAllocation}
                  onChange={(e) => setFormData({ ...formData, trafficAllocation: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="RUNNING">Running</option>
                    <option value="PAUSED">Paused</option>
                    <option value="ENDED">Ended</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-2">Delete Experiment?</h2>
            <p className="text-slate-400 mb-6">This action cannot be undone. All experiment data will be deleted.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

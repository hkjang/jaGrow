'use client';

import { useState, useEffect } from 'react';

interface Rule {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  isActive: boolean;
  conditions: string;
  actions: string;
  lastTriggeredAt: string | null;
  triggerCount: number;
}



export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSimulator, setShowSimulator] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'pause_low_performer',
    conditions: '',
    actions: ''
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        loadMockData();
      }
    } catch (error) {
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setRules([
      { id: '1', name: 'Pause Low ROAS Campaigns', description: 'Automatically pause campaigns with low ROAS', ruleType: 'pause_low_performer', isActive: true, conditions: 'ROAS < 1.0 for 3 days', actions: 'Pause campaign', lastTriggeredAt: '2024-12-12 15:30', triggerCount: 12 },
      { id: '2', name: 'Increase Budget on High CTR', description: 'Boost budget for high-performing campaigns', ruleType: 'increase_budget', isActive: true, conditions: 'CTR > 3% AND Conversions > 10', actions: 'Increase budget by 20%', lastTriggeredAt: '2024-12-12 10:00', triggerCount: 8 },
      { id: '3', name: 'Alert on CPA Spike', description: 'Send alert when CPA exceeds threshold', ruleType: 'alert', isActive: true, conditions: 'CPA > 150% of average', actions: 'Send Slack notification', lastTriggeredAt: '2024-12-11 18:00', triggerCount: 3 },
      { id: '4', name: 'Weekend Budget Reduction', description: 'Reduce budget on weekends', ruleType: 'decrease_budget', isActive: false, conditions: 'Day is Sat/Sun', actions: 'Decrease budget by 30%', lastTriggeredAt: null, triggerCount: 0 },
    ]);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', description: '', ruleType: 'pause_low_performer', conditions: '', actions: '' });
    setEditingRule(null);
    setShowModal(true);
  };

  const openEditModal = (rule: Rule) => {
    setModalMode('edit');
    setFormData({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      conditions: rule.conditions,
      actions: rule.actions
    });
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('규칙 이름을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        const newRule: Rule = {
          id: Date.now().toString(),
          ...formData,
          isActive: true,
          lastTriggeredAt: null,
          triggerCount: 0
        };
        setRules([...rules, newRule]);
      } else if (editingRule) {
        setRules(rules.map(r =>
          r.id === editingRule.id ? { ...r, ...formData } : r
        ));
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setShowDeleteConfirm(null);
  };

  const toggleActive = (rule: Rule) => {
    setRules(rules.map(r =>
      r.id === rule.id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const ruleTypes = [
    { value: 'pause_low_performer', label: 'Pause Low Performer' },
    { value: 'increase_budget', label: 'Increase Budget' },
    { value: 'decrease_budget', label: 'Decrease Budget' },
    { value: 'alert', label: 'Send Alert' },
    { value: 'expand_creative', label: 'Expand Creative' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Automation Rules</h1>
          <p className="text-slate-400 mt-1">Manage and simulate optimization rules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
          >
            🧪 Simulator
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            + Create Rule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Rules</p>
          <p className="text-2xl font-bold text-white mt-1">{rules.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{rules.filter(r => r.isActive).length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{rules.filter(r => !r.isActive).length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Triggers</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{rules.reduce((sum, r) => sum + r.triggerCount, 0)}</p>
        </div>
      </div>

      {/* Simulator Panel */}
      {showSimulator && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-white mb-4">Rule Simulator</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Select Rule</label>
              <select className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Sample Events</label>
              <input
                type="number"
                defaultValue={100}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Run Simulation
          </button>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-6 rounded-2xl border transition-all ${
              rule.isActive
                ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                : 'bg-slate-800/30 border-slate-700/50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                  <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full">
                    {rule.ruleType.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-2">{rule.description}</p>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="font-mono">{rule.conditions}</span>
                  <span>•</span>
                  <span>Triggered {rule.triggerCount} times</span>
                  {rule.lastTriggeredAt && (
                    <>
                      <span>•</span>
                      <span>Last: {rule.lastTriggeredAt}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(rule)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(rule.id)}
                  className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600 hover:text-white"
                >
                  Delete
                </button>
                <button
                  onClick={() => toggleActive(rule)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    rule.isActive
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {modalMode === 'create' ? 'Create Rule' : 'Edit Rule'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Rule Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="예: Pause Low ROAS Campaigns"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                  placeholder="규칙에 대한 설명"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Rule Type</label>
                <select
                  value={formData.ruleType}
                  onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {ruleTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Conditions</label>
                <input
                  type="text"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="예: ROAS < 1.0 for 3 days"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Actions</label>
                <input
                  type="text"
                  value={formData.actions}
                  onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="예: Pause campaign"
                />
              </div>
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-2">Delete Rule?</h2>
            <p className="text-slate-400 mb-6">This action cannot be undone.</p>
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

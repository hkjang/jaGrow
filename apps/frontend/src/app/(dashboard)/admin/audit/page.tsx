'use client';

import { useState } from 'react';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
}

const mockLogs: AuditLog[] = [
  { id: '1', userId: 'u1', userEmail: 'admin@jagrow.io', action: 'approve', resource: 'experiment', resourceId: 'exp_42', timestamp: '2024-12-12 19:25:00', ipAddress: '192.168.1.1' },
  { id: '2', userId: 'u2', userEmail: 'ops@jagrow.io', action: 'connect', resource: 'integration', resourceId: 'int_google', timestamp: '2024-12-12 19:15:00', ipAddress: '192.168.1.2' },
  { id: '3', userId: 'u1', userEmail: 'admin@jagrow.io', action: 'update', resource: 'rule', resourceId: 'rule_7', timestamp: '2024-12-12 18:30:00', ipAddress: '192.168.1.1' },
  { id: '4', userId: 'u3', userEmail: 'super@jagrow.io', action: 'create', resource: 'tenant', resourceId: 'tenant_acme', timestamp: '2024-12-12 17:00:00', ipAddress: '10.0.0.1' },
  { id: '5', userId: 'u1', userEmail: 'admin@jagrow.io', action: 'delete', resource: 'user', resourceId: 'user_old', timestamp: '2024-12-12 16:45:00', ipAddress: '192.168.1.1' },
  { id: '6', userId: 'u2', userEmail: 'ops@jagrow.io', action: 'reject', resource: 'experiment', resourceId: 'exp_40', timestamp: '2024-12-12 15:30:00', ipAddress: '192.168.1.2' },
  { id: '7', userId: 'u4', userEmail: 'dataops@jagrow.io', action: 'create', resource: 'schema', resourceId: 'schema_events', timestamp: '2024-12-12 14:00:00', ipAddress: '192.168.1.5' },
  { id: '8', userId: 'u1', userEmail: 'admin@jagrow.io', action: 'update', resource: 'quota', resourceId: 'quota_acme', timestamp: '2024-12-12 12:00:00', ipAddress: '192.168.1.1' },
];

const actionColors: Record<string, string> = {
  approve: 'bg-green-500/20 text-green-400',
  create: 'bg-blue-500/20 text-blue-400',
  update: 'bg-yellow-500/20 text-yellow-400',
  delete: 'bg-red-500/20 text-red-400',
  reject: 'bg-orange-500/20 text-orange-400',
  connect: 'bg-purple-500/20 text-purple-400',
};

export default function AuditPage() {
  const [logs] = useState<AuditLog[]>(mockLogs);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch = log.userEmail.includes(searchQuery) || 
                          log.resource.includes(searchQuery) ||
                          log.resourceId.includes(searchQuery);
    return matchesAction && matchesSearch;
  });

  const actions = [...new Set(mockLogs.map(l => l.action))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 mt-1">Track all admin actions and changes</p>
        </div>
        <button className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center gap-2">
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by email, resource..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setActionFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              actionFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                actionFilter === action ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
        <div className="divide-y divide-slate-700">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${actionColors[log.action]}`}>
                  {log.action === 'approve' ? '✓' :
                   log.action === 'create' ? '+' :
                   log.action === 'update' ? '✏️' :
                   log.action === 'delete' ? '🗑️' :
                   log.action === 'reject' ? '✕' : '🔗'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${actionColors[log.action]}`}>
                      {log.action}
                    </span>
                    <span className="text-white font-medium">{log.resource}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-slate-400 font-mono text-sm">{log.resourceId}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="text-slate-400">
                      by <span className="text-white">{log.userEmail}</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{log.timestamp}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500 font-mono text-xs">{log.ipAddress}</span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-white transition-colors">
                  👁️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Showing {filteredLogs.length} of {logs.length} entries</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
            ← Previous
          </button>
          <button className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

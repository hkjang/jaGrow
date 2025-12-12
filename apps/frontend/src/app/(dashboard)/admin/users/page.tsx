'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    email: '', 
    name: '', 
    role: 'VIEWER',
    password: ''
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        loadMockData();
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setUsers([
      { id: '1', email: 'admin@techstartup.kr', name: '김철수', role: 'ADMIN', organizationId: '1', organizationName: 'TechStartup', isActive: true, createdAt: '2024-01-15', lastLoginAt: '2024-12-12' },
      { id: '2', email: 'editor1@techstartup.kr', name: '이영희', role: 'EDITOR', organizationId: '1', organizationName: 'TechStartup', isActive: true, createdAt: '2024-02-20', lastLoginAt: '2024-12-10' },
      { id: '3', email: 'viewer1@techstartup.kr', name: '박민수', role: 'VIEWER', organizationId: '1', organizationName: 'TechStartup', isActive: true, createdAt: '2024-03-05' },
      { id: '4', email: 'admin@digitalmarketing.kr', name: '강서영', role: 'ADMIN', organizationId: '2', organizationName: 'DigitalMarketing', isActive: true, createdAt: '2024-01-20', lastLoginAt: '2024-12-11' },
      { id: '5', email: 'viewer@oldcompany.com', name: '정현우', role: 'VIEWER', organizationId: '3', organizationName: 'OldCompany', isActive: false, createdAt: '2023-11-10' },
    ]);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ email: '', name: '', role: 'VIEWER', password: '' });
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setFormData({ email: user.email, name: user.name, role: user.role, password: '' });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      alert('이메일과 이름을 입력해주세요');
      return;
    }
    if (modalMode === 'create' && !formData.password) {
      alert('비밀번호를 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      if (modalMode === 'create') {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const newUser = await response.json();
          setUsers([...users, newUser]);
        } else {
          // Mock create
          const newUser: User = {
            id: Date.now().toString(),
            email: formData.email,
            name: formData.name,
            role: formData.role,
            organizationId: '1',
            organizationName: 'New Org',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0]
          };
          setUsers([...users, newUser]);
        }
      } else if (editingUser) {
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: formData.name, role: formData.role })
        });
        
        if (response.ok) {
          const updatedUser = await response.json();
          setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
        } else {
          // Mock update
          setUsers(users.map(u => 
            u.id === editingUser.id 
              ? { ...u, name: formData.name, role: formData.role } 
              : u
          ));
        }
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      // Mock save for demo
      if (modalMode === 'create') {
        const newUser: User = {
          id: Date.now().toString(),
          email: formData.email,
          name: formData.name,
          role: formData.role,
          organizationId: '1',
          organizationName: 'New Org',
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setUsers([...users, newUser]);
      } else if (editingUser) {
        setUsers(users.map(u => 
          u.id === editingUser.id 
            ? { ...u, name: formData.name, role: formData.role } 
            : u
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
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
    setUsers(users.filter(u => u.id !== id));
    setShowDeleteConfirm(null);
  };

  const toggleActive = (user: User) => {
    const updated = { ...user, isActive: !user.isActive };
    setUsers(users.map(u => u.id === user.id ? updated : u));
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-red-500/20 text-red-400',
      EDITOR: 'bg-blue-500/20 text-blue-400',
      VIEWER: 'bg-slate-500/20 text-slate-400'
    };
    return styles[role] || styles.VIEWER;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users & Roles</h1>
          <p className="text-slate-400 mt-1">Manage users and their permissions</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
        >
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editor</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Organization</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Last Login</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300">{user.organizationName}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(user)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {user.lastLoginAt || 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(user.id)}
                      className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {modalMode === 'create' ? 'Add User' : 'Edit User'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="user@example.com"
                  disabled={modalMode === 'edit'}
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    placeholder="••••••••"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
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
                {saving ? 'Saving...' : modalMode === 'create' ? 'Add User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
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

'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  keyName: string;
  apiKey: string;
  permissions: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/settings/security/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const maskApiKey = (key: string) => {
    return key.slice(0, 8) + '...' + key.slice(-4);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🔑 API 인증</h1>
          <p className="text-slate-400 mt-1">API 키를 생성하고 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 API 키
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {apiKeys.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">등록된 API 키가 없습니다.</p>
            </div>
          ) : (
            apiKeys.map((key) => (
              <div key={key.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{key.keyName}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        key.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {key.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-sm font-mono text-slate-300">
                        {showKey === key.id ? key.apiKey : maskApiKey(key.apiKey)}
                      </code>
                      <button 
                        onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        {showKey === key.id ? '숨기기' : '보기'}
                      </button>
                      <button 
                        onClick={() => navigator.clipboard.writeText(key.apiKey)}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        복사
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">권한: </span>
                        <span className="text-slate-300">{key.permissions.join(', ') || '없음'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">마지막 사용: </span>
                        <span className="text-slate-300">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : '없음'}
                        </span>
                      </div>
                      {key.expiresAt && (
                        <div>
                          <span className="text-slate-500">만료: </span>
                          <span className="text-slate-300">
                            {new Date(key.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                      편집
                    </button>
                    <button className="px-3 py-1 text-sm text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

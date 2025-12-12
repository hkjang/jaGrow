'use client';

import { useState, useEffect } from 'react';

interface DashboardTemplate {
  id: string;
  name: string;
  layout: Record<string, unknown>;
  colorScheme: string;
  isDefault: boolean;
}

export default function DashboardTemplatesPage() {
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/settings/reports/dashboard-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🎨 대시보드 템플릿</h1>
          <p className="text-slate-400 mt-1">대시보드 레이아웃과 위젯을 커스터마이징합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + 새 템플릿
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">등록된 템플릿이 없습니다.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  {template.isDefault && (
                    <span className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded-full">기본</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <span className={`w-3 h-3 rounded-full ${template.colorScheme === 'dark' ? 'bg-slate-600' : 'bg-white border border-slate-300'}`} />
                  {template.colorScheme === 'dark' ? '다크 모드' : '라이트 모드'}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                    미리보기
                  </button>
                  <button className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    편집
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

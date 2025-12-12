'use client';

import { useState } from 'react';

export default function UTMPage() {
  const [formData, setFormData] = useState({
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: '',
    baseUrl: '',
  });
  const [generatedUrl, setGeneratedUrl] = useState('');

  const generateUTM = () => {
    const params = new URLSearchParams();
    if (formData.source) params.set('utm_source', formData.source);
    if (formData.medium) params.set('utm_medium', formData.medium);
    if (formData.campaign) params.set('utm_campaign', formData.campaign);
    if (formData.content) params.set('utm_content', formData.content);
    if (formData.term) params.set('utm_term', formData.term);
    
    const url = formData.baseUrl 
      ? `${formData.baseUrl}${formData.baseUrl.includes('?') ? '&' : '?'}${params.toString()}`
      : `?${params.toString()}`;
    setGeneratedUrl(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🔗 UTM 관리</h1>
        <p className="text-slate-400 mt-1">UTM 파라미터를 생성하고 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UTM 생성기 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">UTM 생성기</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">기본 URL</label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://example.com/page"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Source *</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="google, facebook"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Medium *</label>
                <input
                  type="text"
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  placeholder="cpc, email, social"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Campaign *</label>
              <input
                type="text"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                placeholder="spring_sale_2024"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Content</label>
                <input
                  type="text"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="banner_a"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Term</label>
                <input
                  type="text"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  placeholder="keyword"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={generateUTM}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              UTM 생성
            </button>
          </div>

          {generatedUrl && (
            <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">생성된 URL</span>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  복사
                </button>
              </div>
              <p className="text-green-400 text-sm break-all">{generatedUrl}</p>
            </div>
          )}
        </div>

        {/* UTM 규칙 목록 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">저장된 UTM 규칙</h2>
            <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              + 규칙 추가
            </button>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm text-center">저장된 UTM 규칙이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

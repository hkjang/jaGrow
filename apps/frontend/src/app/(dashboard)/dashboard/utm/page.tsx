'use client';

import { useState } from 'react';

interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

interface GeneratedUTM {
  id: string;
  baseUrl: string;
  params: UTMParams;
  fullUrl: string;
  createdAt: string;
}

export default function UTMPage() {
  const [baseUrl, setBaseUrl] = useState('https://example.com');
  const [params, setParams] = useState<UTMParams>({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: ''
  });
  const [history, setHistory] = useState<GeneratedUTM[]>([]);
  const [copied, setCopied] = useState(false);

  const generateUrl = () => {
    if (!params.source || !params.medium || !params.campaign) {
      alert('Source, Medium, Campaign are required');
      return;
    }

    const urlParams = new URLSearchParams();
    if (params.source) urlParams.set('utm_source', params.source);
    if (params.medium) urlParams.set('utm_medium', params.medium);
    if (params.campaign) urlParams.set('utm_campaign', params.campaign);
    if (params.term) urlParams.set('utm_term', params.term);
    if (params.content) urlParams.set('utm_content', params.content);

    const fullUrl = `${baseUrl}?${urlParams.toString()}`;
    
    const newEntry: GeneratedUTM = {
      id: Date.now().toString(),
      baseUrl,
      params: { ...params },
      fullUrl,
      createdAt: new Date().toISOString()
    };

    setHistory([newEntry, ...history]);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    { label: 'Google Ads', source: 'google', medium: 'cpc' },
    { label: 'Facebook', source: 'facebook', medium: 'paid_social' },
    { label: 'Instagram', source: 'instagram', medium: 'paid_social' },
    { label: 'Email', source: 'newsletter', medium: 'email' },
    { label: 'Naver', source: 'naver', medium: 'cpc' },
  ];

  const applyPreset = (preset: { source: string; medium: string }) => {
    setParams({ ...params, source: preset.source, medium: preset.medium });
  };

  const fullUrl = params.source && params.medium && params.campaign
    ? `${baseUrl}?utm_source=${params.source}&utm_medium=${params.medium}&utm_campaign=${params.campaign}${params.term ? '&utm_term=' + params.term : ''}${params.content ? '&utm_content=' + params.content : ''}`
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">UTM Generator</h1>
        <p className="text-slate-400 mt-1">Create and manage UTM tracking parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Form */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Create UTM Link</h2>
          
          {/* Presets */}
          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-2">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-2">Base URL *</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="https://your-website.com"
            />
          </div>

          {/* UTM Parameters */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Source * <span className="text-xs">(utm_source)</span></label>
              <input
                type="text"
                value={params.source}
                onChange={(e) => setParams({ ...params, source: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="google, facebook, newsletter"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Medium * <span className="text-xs">(utm_medium)</span></label>
              <input
                type="text"
                value={params.medium}
                onChange={(e) => setParams({ ...params, medium: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="cpc, email, social"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-400 block mb-2">Campaign * <span className="text-xs">(utm_campaign)</span></label>
              <input
                type="text"
                value={params.campaign}
                onChange={(e) => setParams({ ...params, campaign: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="spring_sale, product_launch"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Term <span className="text-xs">(utm_term)</span></label>
              <input
                type="text"
                value={params.term}
                onChange={(e) => setParams({ ...params, term: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="keyword"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Content <span className="text-xs">(utm_content)</span></label>
              <input
                type="text"
                value={params.content}
                onChange={(e) => setParams({ ...params, content: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="banner_a, cta_button"
              />
            </div>
          </div>

          {/* Preview */}
          {fullUrl && (
            <div className="mb-4 p-4 bg-slate-900 rounded-lg">
              <label className="text-sm text-slate-400 block mb-2">Preview</label>
              <p className="text-green-400 text-sm break-all">{fullUrl}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={generateUrl}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Generate & Save
            </button>
            <button
              onClick={() => copyToClipboard(fullUrl)}
              disabled={!fullUrl}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent UTM Links</h2>
          {history.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No UTM links generated yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="p-3 bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white font-medium">{item.params.campaign}</span>
                    <button
                      onClick={() => copyToClipboard(item.fullUrl)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">
                    {item.params.source} / {item.params.medium}
                  </p>
                  <p className="text-xs text-green-400 break-all">{item.fullUrl}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface GeneratedCopy {
  id: string;
  type: string;
  headline: string;
  body: string;
  cta: string;
  createdAt: string;
}

export default function AICopyPage() {
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [platform, setPlatform] = useState('general');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedCopy[]>([]);

  const tones = [
    { value: 'professional', label: '전문적' },
    { value: 'friendly', label: '친근한' },
    { value: 'urgent', label: '긴급한' },
    { value: 'playful', label: '유쾌한' },
    { value: 'luxurious', label: '고급스러운' },
  ];

  const platforms = [
    { value: 'general', label: '일반' },
    { value: 'google', label: 'Google Ads' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'naver', label: 'Naver' },
  ];

  const generateCopy = async () => {
    if (!productName || !productDesc) {
      alert('제품명과 설명을 입력해주세요');
      return;
    }

    setLoading(true);
    
    // Simulate API call - will connect to backend /ai/copy/generate later
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newResults: GeneratedCopy[] = [
      {
        id: Date.now().toString() + '1',
        type: 'Option A',
        headline: `${productName} - 당신의 성공을 위한 최고의 선택`,
        body: `${productDesc} 지금 바로 경험해보세요. ${targetAudience || '모든 고객'}을 위한 특별한 제안입니다.`,
        cta: '지금 시작하기',
        createdAt: new Date().toISOString()
      },
      {
        id: Date.now().toString() + '2',
        type: 'Option B',
        headline: `새로운 ${productName}을 만나보세요`,
        body: `${productDesc} 한정된 기간 동안만 제공되는 특별 혜택을 놓치지 마세요!`,
        cta: '자세히 알아보기',
        createdAt: new Date().toISOString()
      },
      {
        id: Date.now().toString() + '3',
        type: 'Option C',
        headline: `왜 ${productName}인가요?`,
        body: `${productDesc} 수천 명의 고객이 선택한 이유를 확인해보세요.`,
        cta: '무료 체험하기',
        createdAt: new Date().toISOString()
      },
    ];

    setResults(newResults);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">AI Copywriter</h1>
        <p className="text-slate-400 mt-1">Generate compelling ad copy with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">입력 정보</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">제품/서비스명 *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="예: JaGrow 마케팅 플랫폼"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">제품 설명 *</label>
              <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                placeholder="제품의 주요 기능과 장점을 설명해주세요"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">타겟 오디언스</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="예: 마케팅 담당자, 스타트업 창업자"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">톤 & 스타일</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {tones.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">플랫폼</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={generateCopy}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {loading ? '✨ 생성 중...' : '✨ AI 카피 생성'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">생성된 카피</h2>
          
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <span className="text-4xl mb-4">✨</span>
              <p>왼쪽에서 정보를 입력하고 생성 버튼을 클릭하세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="p-4 bg-slate-900 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-400 bg-blue-400/20 px-2 py-1 rounded">
                      {result.type}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${result.headline}\n\n${result.body}\n\n${result.cta}`)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      📋 Copy All
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Headline</p>
                      <p className="text-white font-medium">{result.headline}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Body</p>
                      <p className="text-slate-300 text-sm">{result.body}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">CTA</p>
                      <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">
                        {result.cta}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

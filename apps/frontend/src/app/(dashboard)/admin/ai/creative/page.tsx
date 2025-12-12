'use client';

import { useState } from 'react';

export default function AICreativePage() {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<'copy' | 'headline' | 'description'>('copy');

  const generateContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ad-integration/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: contentType }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.content || data.copy);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">✨ 소재 자동 생성</h1>
        <p className="text-slate-400 mt-1">AI를 활용하여 광고 문구와 소재를 자동으로 생성합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 영역 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">생성 설정</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">콘텐츠 유형</label>
              <div className="flex gap-2">
                {(['copy', 'headline', 'description'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      contentType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type === 'copy' && '광고 문구'}
                    {type === 'headline' && '헤드라인'}
                    {type === 'description' && '설명'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">프롬프트</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="생성할 콘텐츠에 대한 설명을 입력하세요. 예: 20대 여성 타겟, 봄 세일 캠페인용 헤드라인"
                className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">톤</label>
                <select className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg">
                  <option value="professional">전문적인</option>
                  <option value="friendly">친근한</option>
                  <option value="playful">장난스러운</option>
                  <option value="urgent">긴급한</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">길이</label>
                <select className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg">
                  <option value="short">짧게</option>
                  <option value="medium">보통</option>
                  <option value="long">길게</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateContent}
              disabled={loading || !prompt}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '✨ 콘텐츠 생성'}
            </button>
          </div>
        </div>

        {/* 결과 영역 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">생성 결과</h2>
            {generatedContent && (
              <button 
                onClick={() => navigator.clipboard.writeText(generatedContent)}
                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                복사
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : generatedContent ? (
            <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
              <p className="text-white whitespace-pre-wrap">{generatedContent}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              프롬프트를 입력하고 생성 버튼을 클릭하세요.
            </div>
          )}

          {/* 히스토리 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-400 mb-3">최근 생성 기록</h3>
            <div className="space-y-2">
              <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-400">
                생성 기록이 없습니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

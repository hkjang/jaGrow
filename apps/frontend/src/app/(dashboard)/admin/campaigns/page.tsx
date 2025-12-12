'use client';

import { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  currency: string | null;
  externalId: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/ad-integration/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-600/20 text-green-400';
      case 'paused': return 'bg-yellow-600/20 text-yellow-400';
      case 'ended': return 'bg-red-600/20 text-red-400';
      default: return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">📢 캠페인 관리</h1>
          <p className="text-slate-400 mt-1">광고 캠페인을 통합 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            동기화
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            + 새 캠페인
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="flex gap-4">
        <select className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">
          <option value="">모든 플랫폼</option>
          <option value="google">Google Ads</option>
          <option value="meta">Meta Ads</option>
          <option value="naver">Naver Ads</option>
          <option value="kakao">Kakao Ads</option>
        </select>
        <select className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">
          <option value="">모든 상태</option>
          <option value="active">활성</option>
          <option value="paused">일시중지</option>
          <option value="ended">종료</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr className="text-slate-400 text-sm">
                <th className="px-6 py-4 text-left">캠페인명</th>
                <th className="px-6 py-4 text-left">상태</th>
                <th className="px-6 py-4 text-right">예산</th>
                <th className="px-6 py-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    등록된 캠페인이 없습니다.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{campaign.name}</div>
                      <div className="text-slate-500 text-sm">{campaign.externalId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      {campaign.budget ? `${campaign.budget.toLocaleString()} ${campaign.currency || 'KRW'}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        상세
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

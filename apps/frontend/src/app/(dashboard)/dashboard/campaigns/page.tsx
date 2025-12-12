'use client';

import { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roas: number;
  cpc: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  useEffect(() => {
    setCampaigns([
      { id: '1', name: '브랜드 인지도 캠페인', platform: 'GOOGLE', status: 'active', budget: 1000000, spend: 750000, impressions: 250000, clicks: 8500, ctr: 3.4, conversions: 210, roas: 3.5, cpc: 88 },
      { id: '2', name: '리타겟팅 캠페인', platform: 'META', status: 'active', budget: 500000, spend: 420000, impressions: 180000, clicks: 5200, ctr: 2.9, conversions: 145, roas: 4.2, cpc: 81 },
      { id: '3', name: '신제품 런칭', platform: 'GOOGLE', status: 'active', budget: 800000, spend: 650000, impressions: 320000, clicks: 9800, ctr: 3.1, conversions: 280, roas: 3.8, cpc: 66 },
      { id: '4', name: '앱 설치 캠페인', platform: 'TIKTOK', status: 'paused', budget: 300000, spend: 180000, impressions: 95000, clicks: 2100, ctr: 2.2, conversions: 65, roas: 2.1, cpc: 86 },
      { id: '5', name: '검색 광고', platform: 'NAVER', status: 'active', budget: 600000, spend: 520000, impressions: 140000, clicks: 6200, ctr: 4.4, conversions: 195, roas: 4.5, cpc: 84 },
      { id: '6', name: '인스타 스토리', platform: 'META', status: 'active', budget: 400000, spend: 380000, impressions: 220000, clicks: 7800, ctr: 3.5, conversions: 125, roas: 2.9, cpc: 49 },
    ]);
    setLoading(false);
  }, []);

  const filteredCampaigns = selectedPlatform === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.platform === selectedPlatform);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaign Analytics</h1>
          <p className="text-slate-400 mt-1">Monitor and analyze your campaign performance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Platforms</option>
            <option value="GOOGLE">Google</option>
            <option value="META">Meta</option>
            <option value="TIKTOK">TikTok</option>
            <option value="NAVER">Naver</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Active Campaigns</p>
          <p className="text-2xl font-bold text-white mt-1">{filteredCampaigns.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Spend</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(filteredCampaigns.reduce((s, c) => s + c.spend, 0))}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Avg CTR</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{(filteredCampaigns.reduce((s, c) => s + c.ctr, 0) / filteredCampaigns.length).toFixed(1)}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Conversions</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{filteredCampaigns.reduce((s, c) => s + c.conversions, 0)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Avg ROAS</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{(filteredCampaigns.reduce((s, c) => s + c.roas, 0) / filteredCampaigns.length).toFixed(1)}x</p>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Campaign</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Platform</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Budget</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Spend</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">CTR</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">CPC</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Conversions</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredCampaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                <td className="px-6 py-4 text-white font-medium">{campaign.name}</td>
                <td className="px-6 py-4 text-slate-300">{campaign.platform}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300 text-right">{formatCurrency(campaign.budget)}</td>
                <td className="px-6 py-4 text-white text-right">{formatCurrency(campaign.spend)}</td>
                <td className="px-6 py-4 text-blue-400 text-right">{campaign.ctr}%</td>
                <td className="px-6 py-4 text-slate-300 text-right">{formatCurrency(campaign.cpc)}</td>
                <td className="px-6 py-4 text-green-400 text-right">{campaign.conversions}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-bold ${campaign.roas >= 4 ? 'text-green-400' : campaign.roas >= 3 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {campaign.roas.toFixed(1)}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

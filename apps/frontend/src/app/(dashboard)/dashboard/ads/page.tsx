'use client';

import { useState, useEffect } from 'react';

interface AdAccount {
  id: string;
  platform: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
}

export default function AdsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - will connect to API later
    setAccounts([
      { id: '1', platform: 'GOOGLE', name: 'Main Google Ads', status: 'active', spend: 2500000, impressions: 450000, clicks: 12500, conversions: 320, roas: 3.2 },
      { id: '2', platform: 'META', name: 'Facebook & Instagram', status: 'active', spend: 1800000, impressions: 280000, clicks: 8900, conversions: 245, roas: 2.8 },
      { id: '3', platform: 'TIKTOK', name: 'TikTok Ads', status: 'paused', spend: 500000, impressions: 120000, clicks: 3200, conversions: 85, roas: 1.9 },
      { id: '4', platform: 'NAVER', name: 'Naver Search Ads', status: 'active', spend: 1200000, impressions: 180000, clicks: 6500, conversions: 180, roas: 3.5 },
    ]);
    setLoading(false);
  }, []);

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      GOOGLE: '🔍', META: '📘', TIKTOK: '🎵', NAVER: '🟢', KAKAO: '💬'
    };
    return icons[platform] || '📊';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  const totalSpend = accounts.reduce((sum, acc) => sum + acc.spend, 0);
  const totalConversions = accounts.reduce((sum, acc) => sum + acc.conversions, 0);
  const avgRoas = accounts.length > 0 ? accounts.reduce((sum, acc) => sum + acc.roas, 0) / accounts.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ads Management</h1>
          <p className="text-slate-400 mt-1">Manage your connected ad platforms</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
          + Connect Platform
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Spend</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalSpend)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Connected Platforms</p>
          <p className="text-2xl font-bold text-white mt-1">{accounts.length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Conversions</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatNumber(totalConversions)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Avg ROAS</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{avgRoas.toFixed(2)}x</p>
        </div>
      </div>

      {/* Ad Accounts Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Platform</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Account Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Spend</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Impressions</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Clicks</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Conversions</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <span className="text-2xl mr-2">{getPlatformIcon(account.platform)}</span>
                  <span className="text-white font-medium">{account.platform}</span>
                </td>
                <td className="px-6 py-4 text-white">{account.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    account.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white text-right">{formatCurrency(account.spend)}</td>
                <td className="px-6 py-4 text-slate-300 text-right">{formatNumber(account.impressions)}</td>
                <td className="px-6 py-4 text-slate-300 text-right">{formatNumber(account.clicks)}</td>
                <td className="px-6 py-4 text-green-400 text-right">{formatNumber(account.conversions)}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${account.roas >= 3 ? 'text-green-400' : account.roas >= 2 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {account.roas.toFixed(2)}x
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

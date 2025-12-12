'use client';

import { useState } from 'react';

interface ChannelAttribution {
  channel: string;
  icon: string;
  touchpoints: number;
  conversions: number;
  revenue: number;
  firstTouch: number;
  lastTouch: number;
  linear: number;
  timeDec: number;
}

export default function AttributionPage() {
  const [model, setModel] = useState<'firstTouch' | 'lastTouch' | 'linear' | 'timeDec'>('linear');
  
  const channels: ChannelAttribution[] = [
    { channel: 'Google Ads', icon: '🔍', touchpoints: 4520, conversions: 185, revenue: 18500000, firstTouch: 35, lastTouch: 28, linear: 30, timeDec: 32 },
    { channel: 'Meta Ads', icon: '📘', touchpoints: 3280, conversions: 142, revenue: 12800000, firstTouch: 25, lastTouch: 22, linear: 24, timeDec: 23 },
    { channel: 'Organic Search', icon: '🌐', touchpoints: 2150, conversions: 95, revenue: 8200000, firstTouch: 20, lastTouch: 18, linear: 19, timeDec: 18 },
    { channel: 'Direct', icon: '🔗', touchpoints: 1820, conversions: 78, revenue: 6500000, firstTouch: 8, lastTouch: 22, linear: 15, timeDec: 17 },
    { channel: 'Email', icon: '📧', touchpoints: 980, conversions: 45, revenue: 4200000, firstTouch: 7, lastTouch: 6, linear: 7, timeDec: 6 },
    { channel: 'Referral', icon: '👥', touchpoints: 450, conversions: 22, revenue: 1800000, firstTouch: 5, lastTouch: 4, linear: 5, timeDec: 4 },
  ];

  const models = [
    { key: 'firstTouch', label: 'First Touch', desc: 'Credit to first interaction' },
    { key: 'lastTouch', label: 'Last Touch', desc: 'Credit to last interaction' },
    { key: 'linear', label: 'Linear', desc: 'Equal credit to all touchpoints' },
    { key: 'timeDec', label: 'Time Decay', desc: 'More credit to recent interactions' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
  };

  const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Marketing Attribution</h1>
        <p className="text-slate-400 mt-1">Analyze channel contribution to conversions</p>
      </div>

      {/* Model Selector */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Attribution Model</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {models.map((m) => (
            <button
              key={m.key}
              onClick={() => setModel(m.key as typeof model)}
              className={`p-4 rounded-xl border transition-all text-left ${
                model === m.key
                  ? 'border-blue-500 bg-blue-600/20'
                  : 'border-slate-700 bg-slate-900 hover:border-slate-600'
              }`}
            >
              <p className="font-medium text-white">{m.label}</p>
              <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Channel Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Bars */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Channel Contribution</h2>
          <div className="space-y-4">
            {channels.map((channel) => {
              const percentage = channel[model];
              return (
                <div key={channel.channel}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{channel.icon}</span>
                      <span className="text-white font-medium">{channel.channel}</span>
                    </div>
                    <span className="text-slate-300">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-500">
                    <span>{channel.touchpoints.toLocaleString()} touchpoints</span>
                    <span>{formatCurrency(channel.revenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Attributed Revenue</p>
            <p className="text-2xl font-bold text-white mt-2">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Touchpoints</p>
            <p className="text-2xl font-bold text-blue-400 mt-2">
              {channels.reduce((sum, c) => sum + c.touchpoints, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Conversions</p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              {channels.reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Avg Touchpoints per Conversion</p>
            <p className="text-2xl font-bold text-purple-400 mt-2">
              {(channels.reduce((sum, c) => sum + c.touchpoints, 0) / channels.reduce((sum, c) => sum + c.conversions, 0)).toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

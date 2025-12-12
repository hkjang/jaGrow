'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsProps {
  stats: {
    variationId: string;
    variationName: string;
    assignments: number;
    conversions: number;
    conversionRate: number;
  }[];
}

export function AnalyticsDashboard({ stats }: AnalyticsProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.variationId} className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500 text-sm font-medium">{stat.variationName}</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900">
                {stat.conversionRate.toFixed(1)}%
              </span>
              <span className="ml-2 text-sm text-gray-500">Conv. Rate</span>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {stat.conversions} / {stat.assignments} visitors
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Performance Comparison</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="variationName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversionRate" name="Conversion Rate (%)" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

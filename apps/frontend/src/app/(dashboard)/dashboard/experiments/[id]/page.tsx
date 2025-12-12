'use client';

import { useState, useEffect } from 'react';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

export default function ExperimentDetailsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking fetch for now or use real endpoint if backend running
    // fetch(\`http://localhost:3001/api/analytics/experiments/\${params.id}\`)
    
    // Simulating API response
    setTimeout(() => {
        setData({
            experimentName: 'Button Color Experiment',
            stats: [
                { variationId: '1', variationName: 'Control (Blue)', assignments: 120, conversions: 5, conversionRate: 4.1 },
                { variationId: '2', variationName: 'Variant A (Red)', assignments: 115, conversions: 12, conversionRate: 10.4 },
            ]
        });
        setLoading(false);
    }, 500);
  }, [params.id]);

  if (loading) return <div>Loading analytics...</div>;
  if (!data) return <div>Experiment not found</div>;

  return (
    <div>
       <div className="mb-6">
        <h1 className="text-3xl font-bold">{data.experimentName}</h1>
        <p className="text-gray-500">Real-time performance metrics</p>
      </div>
      
      <AnalyticsDashboard stats={data.stats} />
    </div>
  );
}

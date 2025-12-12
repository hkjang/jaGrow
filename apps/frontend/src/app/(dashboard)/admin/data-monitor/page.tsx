'use client';

export default function DataMonitorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Monitor</h1>
          <p className="text-slate-400 mt-1">Real-time data collection and ETL status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
          <h3 className="text-slate-400 text-sm mb-2">Events/sec</h3>
          <p className="text-3xl font-bold text-white">2,450</p>
          <span className="text-green-400 text-sm">↑ 12% vs avg</span>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
          <h3 className="text-slate-400 text-sm mb-2">Processing Delay</h3>
          <p className="text-3xl font-bold text-white">1.2s</p>
          <span className="text-green-400 text-sm">Normal</span>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
          <h3 className="text-slate-400 text-sm mb-2">Click ID Match Rate</h3>
          <p className="text-3xl font-bold text-white">94.2%</p>
          <span className="text-yellow-400 text-sm">5.8% unmatched</span>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700 text-center">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-xl font-semibold text-white mb-2">Real-time Data Monitoring</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Monitor event collection rates, processing delays, schema validation errors, 
          and click ID matching (gclid/fbp/ttclid).
        </p>
      </div>
    </div>
  );
}

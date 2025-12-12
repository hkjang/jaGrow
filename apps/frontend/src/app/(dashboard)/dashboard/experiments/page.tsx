'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export default function ExperimentsPage() {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<any[]>([]);

  useEffect(() => {
    // In real app, fetch from backend. Mocking for now as backend might not be running or CORS issues.
    // fetch('http://localhost:3001/api/experiments').then...
    setExperiments([
      { id: '1', name: 'Button Color Experiment', status: 'RUNNING', trafficAllocation: 100 },
      { id: '2', name: 'New Pricing Page', status: 'DRAFT', trafficAllocation: 0 },
    ]);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Experiments</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Experiment
        </button>
      </div>
      
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Traffic</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp) => (
              <tr key={exp.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{exp.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${exp.status === 'RUNNING' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {exp.status}
                  </span>
                </td>
                <td className="p-4">{exp.trafficAllocation}%</td>
                <td className="p-4">
                  <button className="text-blue-600 hover:underline mr-2">Edit</button>
                  <button className="text-red-600 hover:underline">Stop</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

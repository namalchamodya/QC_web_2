import React, { useEffect, useState } from 'react';
import { API_BASE } from '../constants';
import { Report } from '../types';
import { StatusHeader } from '../components/StatusHeader';

interface ReportsViewProps {
  timeStr: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ timeStr }) => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
      fetch(`${API_BASE}/api/reports`)
        .then(r => r.json())
        .then(data => setReports(data))
        .catch(e => console.error(e));
  }, []);

  const passCount = reports.filter(r => r.qc_status === 'PASS').length;
  const passRate = reports.length > 0 ? Math.round((passCount / reports.length) * 100) : 0;

  return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6 p-4 h-full">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold uppercase tracking-wider text-white">QC History</h2>
             <StatusHeader statusText="History" timeStr={timeStr} />
           </div>

          <div className="grid grid-cols-3 gap-6">
              <div className="bg-cyber-dark border border-cyber-gray p-6 rounded-2xl">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Total Inspections</div>
                  <div className="text-4xl font-bold text-white mt-2">{reports.length}</div>
              </div>
               <div className="bg-cyber-dark border border-cyber-gray p-6 rounded-2xl">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Pass Rate</div>
                  <div className="text-4xl font-bold text-cyber-cyan mt-2">{passRate}%</div>
              </div>
               <div className="bg-cyber-dark border border-cyber-gray p-6 rounded-2xl">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Last Sync</div>
                  <div className="text-lg font-mono text-gray-300 mt-3">{timeStr}</div>
              </div>
          </div>

          <div className="flex-1 overflow-auto rounded-2xl border border-cyber-gray bg-cyber-dark shadow-xl custom-scrollbar">
            <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-cyber-dark z-10">
                    <tr className="bg-gradient-to-r from-gray-900 to-black text-white border-b border-cyber-gray uppercase text-xs tracking-wider">
                        <th className="p-6 font-semibold text-cyber-blue">Date & Time</th>
                        <th className="p-6 font-semibold">Garment Type</th>
                        <th className="p-6 font-semibold">Detected Size</th>
                        <th className="p-6 font-semibold text-right">QC Result</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {reports.map((r, i) => (
                        <tr key={i} className="group hover:bg-cyber-blue/5 transition-colors cursor-default">
                            <td className="p-6 font-mono text-sm text-gray-300 group-hover:text-white">{new Date(r.timestamp).toLocaleString()}</td>
                            <td className="p-6 capitalize">
                                <span className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300 border border-gray-700">{r.garment_type.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="p-6 font-bold text-white text-lg">{r.detected_size}</td>
                            <td className="p-6 text-right">
                                <span className={`px-4 py-2 rounded-lg text-xs font-bold border ${r.qc_status === 'PASS' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
                                    {r.qc_status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>
  );
};
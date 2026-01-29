import React, { useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE, GARMENT_TYPES } from '../constants';
import { ProcessResult } from '../types';
import { Icons } from '../components/Icons';
import { StatusHeader } from '../components/StatusHeader';

interface MeasureViewProps {
  ppcm: number;
  garmentType: string;
  setGarmentType: (t: string) => void;
  statusText: string;
  setStatusText: (t: string) => void;
  timeStr: string;
}

export const MeasureView: React.FC<MeasureViewProps> = ({ 
  ppcm, garmentType, setGarmentType, statusText, setStatusText, timeStr 
}) => {
  const [lastResult, setLastResult] = useState<ProcessResult | null>(null);
  const [isRawMode, setIsRawMode] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);

  const videoFeedUrl = `${API_BASE}/video_feed`;

  useEffect(() => {
    setStatusText("Camera Ready (Stream)");
  }, []);

  const rotateCamera = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rotate-camera`, { method: 'POST' });
      const data = await res.json();
      setStatusText(`Backend Rotation: ${data.rotation}°`);
    } catch(e) { console.error("Rotate Failed", e); }
  };

  const handleLiveRaw = async (specificGarmentType?: string) => {
    setLastResult(null);
    setIsRawMode(true);
    setStatusText("Live Feed (Raw)");
    try {
      const fd = new FormData();
      fd.append('mode', 'RAW');
      fd.append('pixels_per_cm', ppcm.toString());
      fd.append('garment_type', specificGarmentType || garmentType);
      await fetch(`${API_BASE}/api/set-mode`, { method: 'POST', body: fd });
    } catch(e) { console.error(e); }
  };

  const toggleGarmentType = () => {
      const next = garmentType === 'trousers' ? 'short_sleeve_top' : 'trousers';
      setGarmentType(next);
      handleLiveRaw(next);
  };

  const handleCapture = async () => {
    setStatusText("Processing...");
    setIsRawMode(false);
    setShowQCModal(false);
    const fd = new FormData();
    fd.append('use_internal_cam', 'true'); 
    fd.append('pixels_per_cm', ppcm.toString());
    fd.append('manual_garment_type', garmentType);
    fd.append('save_report', 'false'); 
    try {
        const res = await fetch(`${API_BASE}/process`, { method: 'POST', body: fd });
        const data = await res.json();
        console.log("Process Result:", data);
        if(data.error) throw new Error(data.error);
        setLastResult(data);
        setStatusText("Capture Complete");
        if (data.qc_status === 'FAIL') setShowQCModal(true);
    } catch(e: any) { setStatusText("Error: " + e.message); }
  };

  const handleSaveReport = async () => {
    if (!lastResult || !lastResult.measure_image) return;
    try {
        const block = lastResult.measure_image.split(";");
        const contentType = block[0].split(":")[1];
        const realData = window.atob(block[1].split(",")[1]);
        let array = [];
        for (let i = 0; i < realData.length; i++) array.push(realData.charCodeAt(i));
        const blob = new Blob([new Uint8Array(array)], {type: contentType});
        const fd = new FormData();
        fd.append('file', blob);
        fd.append('pixels_per_cm', ppcm.toString());
        fd.append('manual_garment_type', garmentType);
        fd.append('save_report', 'true');
        const res = await fetch(`${API_BASE}/process`, { method: 'POST', body: fd });
        const d = await res.json();
        alert(`Report Saved Successfully!\nID: ${d.report_id}`);
    } catch(e: any) { alert("Error saving report: " + e.message); } 
  };

  return (
    <div className="flex h-full w-full gap-4 p-4 pr-0 relative"> 
      {showQCModal && lastResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowQCModal(false)}>
            <div className="bg-cyber-dark border-2 border-red-500 p-8 rounded-2xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-bold text-red-500 mb-2">QC FAILED</h2>
                <p className="text-white mb-4">Garment failed Size {lastResult.detected_size} check:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    {lastResult.qc_failures.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
                <button className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl" onClick={() => setShowQCModal(false)}>Dismiss</button>
            </div>
        </div>
      )}

      <div className="flex-1 bg-black rounded-2xl relative overflow-hidden flex items-center justify-center border-2 border-cyber-gray shadow-2xl group min-h-0">
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
           {lastResult && !isRawMode ? (
             <img src={lastResult.measure_image} alt="Result" className="max-w-full max-h-full object-contain"/>
           ) : (
             <img src={videoFeedUrl} alt="Live Stream" className="w-full h-full object-contain"/>
           )}
            <button onClick={rotateCamera} className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full border border-white/10 backdrop-blur transition-all z-30 opacity-70 hover:opacity-100">
              <div className="w-5 h-5 text-cyber-cyan"><Icons.Rotate /></div>
            </button>
           <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(0, 102, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 102, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-96 shrink-0 z-10 p-4 pl-0 h-full min-h-0">
        <StatusHeader statusText={statusText} timeStr={timeStr} />
        <div className="flex gap-2 shrink-0">
          <div className="flex-1 bg-cyber-dark border border-cyber-gray text-white font-bold py-3 rounded-lg text-center text-sm uppercase flex flex-col justify-center">
            <span className="text-[10px] text-gray-400">Detected Size</span>
            <span className="font-mono text-lg">{lastResult ? lastResult.detected_size : '--'}</span>
          </div>
          <button onClick={toggleGarmentType} className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg text-center text-sm uppercase transition-colors shadow-glow-blue">
            <span className="text-[10px] text-blue-200 block">Garment Mode</span>
            {GARMENT_TYPES.find(g => g.id === garmentType)?.label || garmentType}
          </button>
        </div>

        <div className="flex-1 bg-cyber-dark rounded-3xl p-6 flex flex-col items-center justify-center text-center overflow-y-auto shadow-inner border border-cyber-gray relative min-h-0">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0066FF 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          {lastResult ? (
            <div className="w-full h-full flex flex-col gap-2 relative z-10">
              <div className="text-cyber-cyan text-5xl font-mono font-bold mb-2 tracking-tighter">{lastResult.detected_size}</div>
              <div className={`text-sm font-bold px-4 py-1 rounded-full inline-block self-center mb-6 border ${lastResult.qc_status === 'PASS' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-red-900/30 border-red-500 text-red-400'}`}>
                QC STATUS: {lastResult.qc_status}
              </div>
              <div className="w-full text-left space-y-3 mt-2">
                {lastResult.data.map((m, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400 text-sm">{m.name}</span>
                    <span className="text-white font-mono font-bold text-lg">{m.value} <span className="text-xs text-gray-500">cm</span></span>
                  </div>
                ))}
              </div>
              <button onClick={handleSaveReport} className="mt-auto bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg text-xs uppercase tracking-widest border border-gray-600 transition-colors">Save QC Report</button>
            </div>
          ) : (
             <div className="text-gray-600 font-light flex flex-col gap-2">
               <div className="h-2 w-32 bg-gray-800 rounded animate-pulse"></div>
               <div className="h-2 w-24 bg-gray-800 rounded animate-pulse delay-75"></div>
               <div className="h-2 w-28 bg-gray-800 rounded animate-pulse delay-150"></div>
               <p className="mt-4 text-xs tracking-widest uppercase opacity-50">Waiting for Capture</p>
             </div>
          )}
        </div>

        <div className="flex gap-4 h-24 mt-2 shrink-0">
          <button onClick={() => handleLiveRaw()} className={`flex-1 rounded-3xl font-bold text-xl uppercase tracking-wider transition-all shadow-lg border border-transparent ${isRawMode ? 'bg-transparent border-cyber-cyan text-cyber-cyan shadow-glow-cyan' : 'bg-cyber-gray text-gray-400 hover:text-white hover:bg-gray-700'}`}>Live View</button>
          <button onClick={handleCapture} className="flex-1 bg-cyber-blue hover:bg-blue-600 rounded-3xl text-white font-bold text-xl uppercase tracking-wider shadow-glow-blue transition-transform active:scale-95">Capture</button>
        </div>
      </div>
    </div>
  );
};
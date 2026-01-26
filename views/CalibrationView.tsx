import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';
import { StatusHeader } from '../components/StatusHeader';

interface CalibrationViewProps {
  ppcm: number;
  setPpcm: (val: number) => void;
  timeStr: string;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({ ppcm, setPpcm, timeStr }) => {
  const [detectVal, setDetectVal] = useState<string>('');
  const [msg, setMsg] = useState('Position A4 paper in view');
  const [t1, setT1] = useState(50);
  const [t2, setT2] = useState(150);
  const [debugImage, setDebugImage] = useState<string | null>(null);

  const videoFeedUrl = `${API_BASE}/video_feed`;

  useEffect(() => {
    const setCalibMode = async (mode: string) => {
        const fd = new FormData();
        fd.append('mode', mode);
        try {
            await fetch(`${API_BASE}/api/set-mode`, { method: 'POST', body: fd });
        } catch (e) {
            console.error("Mode switch failed", e);
        }
    };
    setCalibMode('CALIBRATION');
    return () => { setCalibMode('RAW'); };
  }, []);

  const handleCapture = async () => {
      setMsg('Backend capturing raw hardware frame...');
      setDetectVal(''); 
      const fd = new FormData();
      fd.append('t1', String(t1)); 
      fd.append('t2', String(t2));
      try {
          const res = await fetch(`${API_BASE}/api/calibrate`, { method: 'POST', body: fd });
          const data = await res.json();
          if(data.debug_image) setDebugImage(data.debug_image);
          if(data.success && data.pixels_per_cm) {
              setMsg("Calibration Successful");
              setDetectVal(String(data.pixels_per_cm)); 
          } else {
              setMsg(data.message || 'A4 paper not detected');
          }
      } catch(e: any) { setMsg('Server Error: ' + e.message); }
  };

  const handleApply = () => {
      const val = parseFloat(detectVal);
      if(val && !isNaN(val)) { 
          setPpcm(val); 
          alert(`✓ Calibration Applied! Value: ${val} px/cm`); 
      }
  };

  return (
      <div className="flex flex-col gap-6 w-full h-full p-6">
          <div className="flex justify-between items-center shrink-0">
               <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Auto Calibration</h2>
               <StatusHeader statusText={msg} timeStr={timeStr} />
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                {/* Left Panel: Live View */}
                <div className="bg-cyber-dark border border-cyber-gray rounded-xl p-6 flex flex-col h-full min-h-0">
                    <h3 className="text-lg font-bold text-white mb-4 shrink-0">Live Camera</h3>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-800 min-h-0">
                        <img src={videoFeedUrl} className="w-full h-full object-contain" alt="Live Feed" />
                    </div>
                    <div className="flex gap-4 mt-4 shrink-0">
                        <button onClick={handleCapture} className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-all shadow-glow-blue">
                            📸 Capture & Calibrate
                        </button>
                    </div>
                </div>

                {/* Right Panel: Result */}
                <div className="bg-cyber-dark border border-cyber-gray rounded-xl p-6 flex flex-col h-full min-h-0">
                    <h3 className="text-lg font-bold text-white mb-4 shrink-0">Result</h3>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-800 min-h-0">
                         {debugImage ? (
                             <img src={debugImage} className="w-full h-full object-contain" alt="Debug Result" />
                         ) : (
                             <div className="text-gray-600 text-sm flex flex-col items-center gap-2">
                                 <span>No calibration performed</span>
                             </div>
                         )}
                    </div>
                    <div className="mt-4 space-y-4 shrink-0">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Threshold 1</label>
                                <input type="number" value={t1} onChange={e => setT1(parseInt(e.target.value))} className="w-full bg-black border border-gray-700 text-white text-xs p-2 rounded focus:border-cyber-blue outline-none" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Threshold 2</label>
                                <input type="number" value={t2} onChange={e => setT2(parseInt(e.target.value))} className="w-full bg-black border border-gray-700 text-white text-xs p-2 rounded focus:border-cyber-blue outline-none" />
                            </div>
                        </div>
                        <div className="bg-black border border-gray-700 rounded-lg p-3 flex justify-between items-center">
                            <label className="text-gray-400 text-sm font-bold">Detected Value</label>
                            <span className="text-cyber-cyan font-mono text-xl font-bold">{detectVal || '--'}</span>
                        </div>
                        <button disabled={!detectVal} onClick={handleApply} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-all">✓ Apply</button>
                    </div>
                </div>
          </div>
      </div>
  );
};
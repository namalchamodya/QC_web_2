import React, { useState, useEffect } from 'react';
import { API_BASE, GARMENT_TYPES } from '../constants';
import { StatusHeader } from '../components/StatusHeader';
import { ProcessResult, GarmentConfig } from '../types';

interface ReferenceViewProps {
  ppcm: number;
  timeStr: string;
}

export const ReferenceView: React.FC<ReferenceViewProps> = ({ ppcm, timeStr }) => {
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [refBlob, setRefBlob] = useState<Blob | null>(null);
  
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [size, setSize] = useState('');
  const [type, setType] = useState('trousers');
  const [isCapturing, setIsCapturing] = useState(true);
  const [garmentConfig, setGarmentConfig] = useState<GarmentConfig | null>(null);
  const [manualValues, setManualValues] = useState<Record<string, string>>({});

  const videoFeedUrl = `${API_BASE}/video_feed`;

  useEffect(() => {
    fetch(`${API_BASE}/api/config`).then(r => r.json()).then(setGarmentConfig).catch(console.error);
  }, []);

  const b64toBlob = (b64Data: string) => {
      const block = b64Data.split(";");
      const contentType = block[0].split(":")[1];
      const realData = atob(block[1].split(",")[1]);
      const arr = new Uint8Array(realData.length);
      for (let i = 0; i < realData.length; i++) arr[i] = realData.charCodeAt(i);
      return new Blob([arr], { type: contentType });
  }

  const handleProcessFrame = async () => {
      const fd = new FormData();
      fd.append('use_internal_cam', 'true');
      fd.append('pixels_per_cm', ppcm.toString());
      fd.append('manual_garment_type', type);

      try {
          const res = await fetch(`${API_BASE}/process`, {method:'POST', body:fd});
          const data = await res.json();
          setResult(data);
          if(data.measure_image) setRefBlob(b64toBlob(data.measure_image));
          setIsCapturing(false);
      } catch(e) { console.error(e); alert("Error processing frame"); }
  };

  const handleSaveReference = async () => {
      if (!size) { alert("Please enter size label."); return; }
      
      const fd = new FormData();
      fd.append('garment_type', type); 
      fd.append('size', size); 

      if (mode === 'auto') {
         if (!refBlob || !result) { alert("Please capture garment."); return; }
         fd.append('file', refBlob); 
         fd.append('measurements', JSON.stringify(result.data));
      } else {
         const measurements = Object.entries(manualValues).map(([k, v]) => ({
             name: k, value: parseFloat(v) || 0, unit: 'cm'
         }));
         fd.append('measurements', JSON.stringify(measurements));
         fd.append('file', new Blob([''], {type: 'text/plain'})); 
      }
      
      try {
          await fetch(`${API_BASE}/api/reference-garment`, {method:'POST', body:fd});
          alert("Reference Saved Successfully!");
          setIsCapturing(true);
          setResult(null);
          setSize('');
          setManualValues({});
      } catch(e) { alert("Error saving reference"); }
  };

  return (
      <div className="flex flex-col gap-6 w-full h-full p-6">
          <div className="flex justify-between items-center shrink-0">
               <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Reference Garment</h2>
               <StatusHeader statusText={`Reference Mode: ${mode}`} timeStr={timeStr} />
          </div>

          <div className="flex gap-4 shrink-0">
              <button onClick={() => setMode('auto')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all border ${mode === 'auto' ? 'bg-cyber-blue text-white border-cyber-blue' : 'bg-cyber-dark text-gray-400 border-gray-700'}`}>From Camera</button>
              <button onClick={() => setMode('manual')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all border ${mode === 'manual' ? 'bg-cyber-blue text-white border-cyber-blue' : 'bg-cyber-dark text-gray-400 border-gray-700'}`}>Manual Entry</button>
          </div>

          <div className="flex gap-4 items-center bg-cyber-dark p-4 rounded-xl border border-cyber-gray shrink-0">
              <label className="text-gray-400">Garment Type:</label>
              <select value={type} onChange={e => { setType(e.target.value); setManualValues({}); }} className="bg-black border border-gray-600 text-white rounded px-3 py-2">
                 {GARMENT_TYPES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
              <label className="text-gray-400 ml-4">Size Label:</label>
              <input type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. M, 32, 42" className="bg-black border border-gray-600 text-white rounded px-3 py-2" />
          </div>

          {mode === 'auto' ? (
              <>
                <div className="flex-1 bg-black border-2 border-cyber-gray rounded-2xl flex items-center justify-center overflow-hidden relative shadow-2xl min-h-0">
                    {isCapturing ? (
                        <img src={videoFeedUrl} className="h-full w-full object-contain" alt="Live Feed" />
                    ) : (
                        result && <img src={result.measure_image} className="h-full w-full object-contain" alt="Ref Result" />
                    )}
                </div>
                
                <div className="flex gap-4 h-20 shrink-0">
                    {isCapturing ? (
                        <button onClick={handleProcessFrame} className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider">Capture Measurement</button>
                    ) : (
                        <>
                            <button onClick={() => setIsCapturing(true)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold uppercase tracking-wider">Retake</button>
                            <button onClick={handleSaveReference} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase tracking-wider">Save Reference Standard</button>
                        </>
                    )}
                </div>
              </>
          ) : (
              <div className="flex-1 bg-cyber-dark border border-cyber-gray rounded-xl p-6 overflow-y-auto">
                 <h3 className="text-lg font-bold text-white mb-4">Enter Standard Measurements (cm)</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                     {garmentConfig && garmentConfig[type] ? (
                         garmentConfig[type].measurements.map(measureName => (
                             <div key={measureName}>
                                 <label className="block text-gray-400 text-xs uppercase mb-1">{measureName}</label>
                                 <input type="number" step="0.1" value={manualValues[measureName] || ''} onChange={e => setManualValues(prev => ({...prev, [measureName]: e.target.value}))} className="w-full bg-black border border-gray-700 text-white rounded px-3 py-2 focus:border-cyber-blue outline-none" />
                             </div>
                         ))
                     ) : <p className="text-gray-500">Loading configuration...</p>}
                 </div>
                 <button onClick={handleSaveReference} className="mt-8 w-full bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold py-4 uppercase tracking-wider">Save Manual Standard</button>
              </div>
          )}
      </div>
  );
};
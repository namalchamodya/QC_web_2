import React, { useState, useRef, useEffect } from 'react';
import { API_BASE, GARMENT_TYPES } from '../constants';
import { StatusHeader } from '../components/StatusHeader';
import { ProcessResult, GarmentConfig } from '../types';

interface ReferenceViewProps {
  ppcm: number;
  timeStr: string;
}

export const ReferenceView: React.FC<ReferenceViewProps> = ({ ppcm, timeStr }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [refBlob, setRefBlob] = useState<Blob | null>(null);
  
  // State
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [size, setSize] = useState('');
  const [type, setType] = useState('trousers');
  const [isCapturing, setIsCapturing] = useState(true);
  
  // Manual Entry State
  const [garmentConfig, setGarmentConfig] = useState<GarmentConfig | null>(null);
  const [manualValues, setManualValues] = useState<Record<string, string>>({});

  // Init Config for Manual Mode
  useEffect(() => {
    fetch(`${API_BASE}/api/config`).then(r => r.json()).then(setGarmentConfig).catch(console.error);
  }, []);

  // Init Camera (Only in Auto Mode)
  useEffect(() => {
    if (mode !== 'auto' || !isCapturing) return;

    let localStream: MediaStream | null = null;
    const startCamera = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const virtualCam = devices.find(d => 
              d.label.includes("Unity") || d.label.includes("Capture") || d.label.includes("Garment")
            );
            const constraints = {
              video: {
                deviceId: virtualCam ? { exact: virtualCam.deviceId } : undefined,
                width: { ideal: 1280 }, height: { ideal: 720 }
              }
            };
            try { localStream = await navigator.mediaDevices.getUserMedia(constraints); } 
            catch { localStream = await navigator.mediaDevices.getUserMedia({ video: true }); }
            
            if (videoRef.current && localStream) videoRef.current.srcObject = localStream;
        } catch (e) { console.error("Ref Cam Error", e); }
    };
    startCamera();
    return () => { if (localStream) localStream.getTracks().forEach(t => t.stop()); };
  }, [mode, isCapturing]);

  const handleProcessFrame = () => {
      if (!videoRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);

      canvas.toBlob(async (blob) => {
          if(!blob) return;
          const fd = new FormData();
          fd.append('file', blob);
          fd.append('pixels_per_cm', ppcm.toString());
          fd.append('manual_garment_type', type);

          try {
              const res = await fetch(`${API_BASE}/process`, {method:'POST', body:fd});
              const data = await res.json();
              setResult(data);
              setRefBlob(blob);
              setIsCapturing(false);
          } catch(e) { console.error(e); alert("Error processing frame"); }
      }, 'image/jpeg');
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
         // Manual Mode
         const measurements = Object.entries(manualValues).map(([k, v]) => ({
             name: k,
             value: parseFloat(v) || 0,
             unit: 'cm'
         }));
         fd.append('measurements', JSON.stringify(measurements));
         // Create dummy blob for backend compat if needed, or backend handles optional file
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
      <div className="flex flex-col gap-6 max-w-5xl mx-auto mt-8 h-full p-6">
          <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Reference Garment</h2>
               <StatusHeader statusText={`Reference Mode: ${mode}`} timeStr={timeStr} />
          </div>

          <div className="flex gap-4">
              <button 
                onClick={() => setMode('auto')} 
                className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all border ${mode === 'auto' ? 'bg-cyber-blue text-white border-cyber-blue' : 'bg-cyber-dark text-gray-400 border-gray-700'}`}
              >
                From Camera
              </button>
              <button 
                onClick={() => setMode('manual')} 
                className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all border ${mode === 'manual' ? 'bg-cyber-blue text-white border-cyber-blue' : 'bg-cyber-dark text-gray-400 border-gray-700'}`}
              >
                Manual Entry
              </button>
          </div>

          <div className="flex gap-4 items-center bg-cyber-dark p-4 rounded-xl border border-cyber-gray">
              <label className="text-gray-400">Garment Type:</label>
              <select value={type} onChange={e => { setType(e.target.value); setManualValues({}); }} className="bg-black border border-gray-600 text-white rounded px-3 py-2">
                 {GARMENT_TYPES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
              
              <label className="text-gray-400 ml-4">Size Label:</label>
              <input type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. M, 32, 42" className="bg-black border border-gray-600 text-white rounded px-3 py-2" />
          </div>

          {mode === 'auto' ? (
              <>
                <div className="flex-1 bg-black border-2 border-cyber-gray rounded-2xl flex items-center justify-center overflow-hidden relative shadow-2xl min-h-[400px]">
                    {isCapturing ? (
                        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
                    ) : (
                        result && <img src={result.measure_image} className="h-full w-full object-contain" alt="Ref Result" />
                    )}
                </div>
                
                <div className="flex gap-4 h-20">
                    {isCapturing ? (
                        <button onClick={handleProcessFrame} className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider">
                            Capture Measurement
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setIsCapturing(true)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold uppercase tracking-wider">
                                Retake
                            </button>
                            <button onClick={handleSaveReference} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase tracking-wider">
                                Save Reference Standard
                            </button>
                        </>
                    )}
                </div>
                {result && !isCapturing && (
                    <div className="bg-cyber-dark p-4 rounded-xl border border-cyber-gray text-sm font-mono text-gray-300">
                        {result.data.map((m, i) => <span key={i} className="mr-4">{m.name}: {m.value}cm</span>)}
                    </div>
                )}
              </>
          ) : (
              <div className="flex-1 bg-cyber-dark border border-cyber-gray rounded-xl p-6">
                 <h3 className="text-lg font-bold text-white mb-4">Enter Standard Measurements (cm)</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                     {garmentConfig && garmentConfig[type] ? (
                         garmentConfig[type].measurements.map(measureName => (
                             <div key={measureName}>
                                 <label className="block text-gray-400 text-xs uppercase mb-1">{measureName}</label>
                                 <input 
                                    type="number" 
                                    step="0.1"
                                    value={manualValues[measureName] || ''}
                                    onChange={e => setManualValues(prev => ({...prev, [measureName]: e.target.value}))}
                                    className="w-full bg-black border border-gray-700 text-white rounded px-3 py-2 focus:border-cyber-blue outline-none"
                                 />
                             </div>
                         ))
                     ) : <p className="text-gray-500">Loading configuration...</p>}
                 </div>
                 <button onClick={handleSaveReference} className="mt-8 w-full bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold py-4 uppercase tracking-wider">
                    Save Manual Standard
                 </button>
              </div>
          )}
      </div>
  );
};
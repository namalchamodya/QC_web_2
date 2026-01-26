import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../constants';
import { StatusHeader } from '../components/StatusHeader';

interface CalibrationViewProps {
  ppcm: number;
  setPpcm: (val: number) => void;
  timeStr: string;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({ ppcm, setPpcm, timeStr }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectVal, setDetectVal] = useState<string>('');
  const [msg, setMsg] = useState('Position A4 paper in view');
  const [t1, setT1] = useState(50);
  const [t2, setT2] = useState(150);
  const [debugImage, setDebugImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // --- 1. Signal Backend Mode ---
  // Tells the backend to enter CALIBRATION mode to hide reference marks
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

    return () => {
        setCalibMode('RAW');
    };
  }, []);

  // --- 2. Camera Initialization ---
  useEffect(() => {
    let localStream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
        try {
            setMsg('Initializing Camera...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const virtualCam = devices.find(d => 
                d.label.includes("Unity") || 
                d.label.includes("Capture") || 
                d.label.includes("Garment") ||
                d.label.includes("Dummy")
            );
            
            const constraints = {
                video: {
                    deviceId: virtualCam ? { exact: virtualCam.deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn("Specific camera failed, trying default...", err);
                localStream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            if (isMounted && localStream) {
                setStream(localStream);
                setIsCameraReady(true);
                setMsg('Camera Ready - Position A4 Paper');
            }
        } catch (err: any) {
            console.error("Camera Error:", err);
            if (isMounted) setMsg(`Camera Error: ${err.message}`);
        }
    };

    startCamera();

    return () => {
        isMounted = false;
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
    };
  }, []);

  // --- 3. Bind Stream to Video Element ---
  useEffect(() => {
      if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Play error:", e));
      }
  }, [stream]);

  // --- 4. Backend Controlled Capture ---
  // Triggers the Python backend to grab the raw hardware frame
  const handleCapture = async () => {
      if (!isCameraReady) {
          alert("Camera is not ready yet.");
          return;
      }

      setMsg('Backend capturing raw hardware frame...');
      setDetectVal(''); 
      
      const fd = new FormData();
      fd.append('t1', String(t1)); 
      fd.append('t2', String(t2));
      
      try {
          // Trigger the backend to capture its own raw_frame
          const res = await fetch(`${API_BASE}/api/calibrate`, { 
              method: 'POST', 
              body: fd 
          });
          const data = await res.json();
          
          if(data.debug_image) {
              setDebugImage(data.debug_image);
          }

          if(data.success && data.pixels_per_cm) {
              setMsg("Calibration Successful");
              // Ensure we convert to string to prevent rendering crashes
              setDetectVal(String(data.pixels_per_cm)); 
          } else {
              setMsg(data.message || 'A4 paper not detected');
          }
      } catch(e: any) {
          setMsg('Server Error: ' + e.message);
      }
  };

  const handleApply = () => {
      const val = parseFloat(detectVal);
      if(val && !isNaN(val)) { 
          setPpcm(val); 
          alert(`✓ Calibration Applied! Value: ${val} px/cm`); 
      }
  };

  return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto mt-8 h-full p-6">
          <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Auto Calibration</h2>
               <StatusHeader statusText={msg} timeStr={timeStr} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full max-h-[600px]">
                {/* Left Panel: Live View */}
                <div className="bg-cyber-dark border border-cyber-gray rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4">Live Camera</h3>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-800 min-h-[350px] h-[350px]">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleCapture} className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-all shadow-glow-blue">
                            📸 Capture & Calibrate
                        </button>
                    </div>
                </div>

                {/* Right Panel: Result */}
                <div className="bg-cyber-dark border border-cyber-gray rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4">Result</h3>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-800 min-h-[350px] h-[350px]">
                         {debugImage ? (
                             <img src={debugImage} className="w-full h-full object-contain" alt="Debug Result" />
                         ) : (
                             <div className="text-gray-600 text-sm flex flex-col items-center gap-2">
                                 <span>No calibration performed</span>
                             </div>
                         )}
                    </div>
                    
                    <div className="mt-4 space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Threshold 1</label>
                                <input 
                                    type="number" 
                                    value={t1} 
                                    onChange={e => setT1(parseInt(e.target.value))} 
                                    className="w-full bg-black border border-gray-700 text-white text-xs p-2 rounded focus:border-cyber-blue outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Threshold 2</label>
                                <input 
                                    type="number" 
                                    value={t2} 
                                    onChange={e => setT2(parseInt(e.target.value))} 
                                    className="w-full bg-black border border-gray-700 text-white text-xs p-2 rounded focus:border-cyber-blue outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-black border border-gray-700 rounded-lg p-3 flex justify-between items-center">
                            <label className="text-gray-400 text-sm font-bold">Detected Value</label>
                            <span className="text-cyber-cyan font-mono text-xl font-bold">{detectVal || '--'}</span>
                        </div>

                        <button 
                            disabled={!detectVal}
                            onClick={handleApply}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-all"
                        >
                            ✓ Apply
                        </button>
                    </div>
                </div>
          </div>
      </div>
  );
};
import React, { useState, useEffect } from 'react';
import { API_BASE } from './constants';
import { ViewState } from './types';

// Modules
import { Sidebar } from './components/Sidebar';

// Views
import { MeasureView } from './views/MeasureView';
import { CalibrationView } from './views/CalibrationView';
import { ReportsView } from './views/ReportsView';
import { MenuGridView } from './views/MenuGridView';
import { ReferenceView } from './views/ReferenceView';
import { SettingsView } from './views/SettingsView';
import { WifiView } from './views/WifiView'; // <--- NEW IMPORT

export default function App() {
  // Global State
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.MEASURE);
  const [ppcm, setPpcm] = useState<number>(8.8);
  const [garmentType, setGarmentType] = useState<string>('trousers');
  const [statusText, setStatusText] = useState<string>('System Ready');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  // Initialization
  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
      const now = new Date();
      setDateStr(now.toLocaleDateString());
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    // Initial Config Load
    const initApi = async () => {
      try {
        // Reset Camera Rotation to 0 on app load/refresh
        const fd = new FormData();
        fd.append('angle', '0'); 
        await fetch(`${API_BASE}/api/rotate-camera`, { method: 'POST', body: fd });
      } catch (e) { console.error("Failed to reset rotation", e); }

      try {
        const calRes = await fetch(`${API_BASE}/api/calibration`);
        const calData = await calRes.json();
        if (calData.pixels_per_cm && calData.pixels_per_cm > 0) {
          setPpcm(calData.pixels_per_cm);
        }
      } catch (e) { console.log('No saved calibration'); }
    };
    initApi();

    return () => clearInterval(timer);
  }, []);

  // --- RENDER ---
  return (
    <div className="w-screen h-screen bg-cyber-black text-cyber-text flex overflow-hidden font-sans">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        
        <div className="flex-1 flex flex-col relative overflow-hidden">
            {currentView === ViewState.MEASURE && (
              <MeasureView 
                ppcm={ppcm} 
                garmentType={garmentType} 
                setGarmentType={setGarmentType}
                statusText={statusText}
                setStatusText={setStatusText}
                timeStr={timeStr}
              />
            )}

            {currentView === ViewState.MENU && (
              <MenuGridView 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                timeStr={timeStr} 
              />
            )}

            {currentView === ViewState.CALIBRATE && (
              <CalibrationView 
                ppcm={ppcm} 
                setPpcm={setPpcm} 
                timeStr={timeStr} 
              />
            )}

            {currentView === ViewState.REPORTS && (
              <ReportsView timeStr={timeStr} />
            )}

            {currentView === ViewState.REFERENCE && (
               <ReferenceView ppcm={ppcm} timeStr={timeStr} />
            )}

            {currentView === ViewState.SETTINGS && (
               <SettingsView timeStr={timeStr} />
            )}

            {currentView === ViewState.WIFI && (
               <WifiView 
                 timeStr={timeStr} 
                 onBack={() => setCurrentView(ViewState.MENU)} 
               />
            )}
        </div>
    </div>
  );
}
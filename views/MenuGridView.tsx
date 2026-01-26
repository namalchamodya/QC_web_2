import React from 'react';
import { ViewState } from '../types';
import { Icons } from '../components/Icons';
import { StatusHeader } from '../components/StatusHeader';

interface MenuGridViewProps {
  currentView: ViewState;
  setCurrentView: (v: ViewState) => void;
  timeStr: string;
}

export const MenuGridView: React.FC<MenuGridViewProps> = ({ currentView, setCurrentView, timeStr }) => {
  return (
     <div className="flex-1 flex flex-col bg-cyber-black p-8">
        <div className="flex justify-between items-center mb-8 border-b border-cyber-gray pb-4">
             <div>
                <h1 className="text-3xl font-bold text-white tracking-widest uppercase">System Menu</h1>
                <p className="text-cyber-blue text-xs tracking-[0.3em] uppercase mt-1">Select Module</p>
             </div>
             <StatusHeader statusText="Menu" timeStr={timeStr} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
            <MenuTile icon={<Icons.Home />} label="Measure" active={currentView === ViewState.MEASURE} onClick={() => setCurrentView(ViewState.MEASURE)} />
            <MenuTile icon={<Icons.Ethernet />} label="Ethernet" onClick={() => {}} />
            <MenuTile icon={<Icons.Wifi />} label="Wi-Fi Setup" onClick={() => {}} />
            <MenuTile icon={<Icons.Calibration />} label="Calibration" active={currentView === ViewState.CALIBRATE} onClick={() => setCurrentView(ViewState.CALIBRATE)} />
            <MenuTile icon={<Icons.Reports />} label="QC Reports" active={currentView === ViewState.REPORTS} onClick={() => setCurrentView(ViewState.REPORTS)} />
            <MenuTile icon={<Icons.Settings />} label="System Settings" active={currentView === ViewState.SETTINGS} onClick={() => setCurrentView(ViewState.SETTINGS)} />
            <MenuTile icon={<Icons.Garment />} label="Reference Garments" active={currentView === ViewState.REFERENCE} onClick={() => setCurrentView(ViewState.REFERENCE)} />
        </div>
     </div>
  );
};

function MenuTile({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) {
    return (
        <button 
          onClick={onClick}
          className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-6 transition-all duration-300 hover:scale-105 active:scale-95 border 
            ${active 
              ? 'bg-gradient-to-br from-cyber-blue to-blue-900 border-cyber-blue text-white shadow-glow-blue' 
              : 'bg-cyber-dark border-cyber-gray text-gray-400 hover:text-white hover:border-cyber-blue hover:shadow-glow-blue'}`}
        >
            <div className={`w-20 h-20 p-4 rounded-2xl ${active ? 'bg-white/10' : 'bg-black/30'}`}>
               {icon}
            </div>
            <span className="text-lg font-bold tracking-wide uppercase">{label}</span>
        </button>
    );
}
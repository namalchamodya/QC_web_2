import React from 'react';
import { ViewState } from '../types';
import { Icons } from './Icons';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const btnClass = (view: ViewState) => `aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg border ${currentView === view ? 'bg-cyber-blue text-white shadow-glow-blue border-white/20' : 'bg-cyber-dark hover:bg-cyber-gray hover:border-cyber-blue text-cyber-blue border-transparent'}`;
  const inactiveBtnClass = (view: ViewState) => `aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg border ${currentView === view ? 'bg-cyber-blue text-white shadow-glow-blue border-white/20' : 'bg-cyber-dark hover:bg-cyber-gray text-gray-400 border-transparent'}`;

  return (
    <div className="flex flex-col gap-4 w-24 shrink-0 z-20 h-full p-4 bg-cyber-black">
      <button onClick={() => setCurrentView(ViewState.MENU)} className={btnClass(ViewState.MENU)}>
        <div className="w-8 h-8"><Icons.Menu /></div>
      </button>

      <button onClick={() => setCurrentView(ViewState.MEASURE)} className={inactiveBtnClass(ViewState.MEASURE)}>
        <div className="w-8 h-8"><Icons.Home /></div>
      </button>

       <button onClick={() => setCurrentView(ViewState.CALIBRATE)} className={inactiveBtnClass(ViewState.CALIBRATE)}>
        <div className="w-8 h-8"><Icons.Calibration /></div>
      </button>

      <button onClick={() => setCurrentView(ViewState.REPORTS)} className={inactiveBtnClass(ViewState.REPORTS)}>
        <div className="w-8 h-8"><Icons.Reports /></div>
      </button>

       <button onClick={() => setCurrentView(ViewState.REFERENCE)} className={inactiveBtnClass(ViewState.REFERENCE)}>
        <div className="w-8 h-8"><Icons.Garment /></div>
      </button>

       <button onClick={() => setCurrentView(ViewState.SETTINGS)} className={inactiveBtnClass(ViewState.SETTINGS)}>
        <div className="w-8 h-8"><Icons.Settings /></div>
      </button>
    </div>
  );
};
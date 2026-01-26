import React from 'react';

interface StatusHeaderProps {
  statusText: string;
  timeStr: string;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({ statusText, timeStr }) => {
  return (
    <div className="flex gap-2 items-center justify-end">
      <div className={`px-4 py-1.5 rounded-full border-2 text-[10px] font-bold uppercase tracking-wider ${
           statusText.toLowerCase().includes("error") || statusText.toLowerCase().includes("fail") ? "border-red-500 text-red-500" : "border-gray-600 text-gray-400"
      }`}>
        {statusText}
      </div>
      <div className="px-4 py-1.5 rounded-full border-2 border-gray-800 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
        {timeStr}
      </div>
    </div>
  );
};
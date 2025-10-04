'use client';

import { useState } from 'react';

interface ScanningScreenProps {
  onScanComplete: () => void;
}

export default function ScanningScreen({ onScanComplete }: ScanningScreenProps) {
  const [isAutoScanning, setIsAutoScanning] = useState(false);

  const handleStopScanning = () => {
    onScanComplete();
  };

  const handleAutoToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAutoScanning(e.target.checked);
    if (e.target.checked) {
      console.log('Auto-scanning enabled');
    } else {
      console.log('Auto-scanning disabled');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900">
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
        <div className="absolute inset-2 border-4 border-blue-500/30 rounded-full"></div>
        <div className="absolute inset-4 border-4 border-blue-500/30 rounded-full"></div>
        <div className="absolute w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/50 to-transparent top-1/2 left-1/2 origin-top-left animate-radar-spin"></div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mt-8">Scanning for Nearby Requests...</h2>
      
      <div className="flex items-center space-x-4 mt-8">
        <label className="flex items-center space-x-2 text-white">
          <input
            type="checkbox"
            checked={isAutoScanning}
            onChange={handleAutoToggle}
            className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
          />
          <span>Auto-scan enabled</span>
        </label>
        <button
          onClick={handleStopScanning}
          className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold"
        >
          Skip & View Dashboard
        </button>
      </div>
    </div>
  );
}

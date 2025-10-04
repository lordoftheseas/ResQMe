'use client';

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ScanningScreenProps {
  onScanComplete: () => void;
}

export default function ScanningScreen({ onScanComplete }: ScanningScreenProps) {
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  // Start animation immediately when component mounts
  useEffect(() => {
    setAnimationStarted(true);
  }, []);

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
      <div className="w-64 h-64">
        {animationStarted && (
          <DotLottieReact
            src="https://lottie.host/184837a6-e422-4d70-baf3-aa8d181bec18/5gqKK8N9Id.lottie"
            loop
            autoplay
          />
        )}
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

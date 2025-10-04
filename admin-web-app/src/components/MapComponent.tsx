'use client';

import dynamic from 'next/dynamic';
import { Alert } from '../types';

// Dynamically import the entire map component to avoid SSR issues
const DynamicMap = dynamic(() => import('./MapComponentClient'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-700 flex items-center justify-center">
      <div className="text-white">Loading map...</div>
    </div>
  )
});

interface MapComponentProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
}

export default function MapComponent({ alerts, onAlertClick }: MapComponentProps) {
  return <DynamicMap alerts={alerts} onAlertClick={onAlertClick} />;
}

'use client';

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import { Alert } from '../types';
import { MapComponentRef } from './MapComponentClient';

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

const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(({ alerts, onAlertClick }, ref) => {
  return <DynamicMap ref={ref} alerts={alerts} onAlertClick={onAlertClick} />;
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;

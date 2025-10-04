'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert } from '../types';

interface MapComponentProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
}

export default function MapComponentClient({ alerts, onAlertClick }: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!isMounted || !mapContainerRef.current || isInitializedRef.current) return;

    // Import Leaflet dynamically
    import('leaflet').then((L) => {
      // Fix for default markers
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Create map only once
      mapRef.current = L.default.map(mapContainerRef.current!).setView([42.3736, -71.1097], 13);

      // Add tile layer
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      isInitializedRef.current = true;
    });
  }, [isMounted]);

  // Update markers when alerts change
  useEffect(() => {
    if (!mapRef.current || !isInitializedRef.current) return;

    // Import Leaflet to get the marker function
    import('leaflet').then((L) => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers
      alerts
        .filter(alert => alert.gps)
        .forEach(alert => {
          const marker = L.default.marker([alert.gps!.lat, alert.gps!.lon])
            .addTo(mapRef.current)
            .bindPopup(`
              <div>
                <b>User:</b> ${alert.userId}<br />
                <b>Time:</b> ${new Date(alert.receivedAt).toLocaleTimeString()}
                ${alert.batteryLevel ? `<br /><b>Battery:</b> ${alert.batteryLevel}%` : ''}
              </div>
            `);
          
          marker.on('click', () => {
            console.log('Marker clicked, zooming to:', alert.gps!.lat, alert.gps!.lon);
            // Zoom to marker
            mapRef.current.flyTo([alert.gps!.lat, alert.gps!.lon], 15);
            
            if (onAlertClick) {
              onAlertClick(alert);
            }
          });
          
          markersRef.current.push(marker);
        });

      // Fit bounds if there are alerts
      if (alerts.filter(alert => alert.gps).length > 0) {
        const bounds = alerts
          .filter(alert => alert.gps)
          .map(alert => [alert.gps!.lat, alert.gps!.lon] as [number, number]);
        
        if (bounds.length > 0) {
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    });
  }, [alerts, onAlertClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      isInitializedRef.current = false;
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-700 flex items-center justify-center">
        <div className="text-white">Loading map...</div>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Alert } from '../types';

interface MapComponentProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
}

export interface MapComponentRef {
  openPopupForAlert: (alert: Alert) => void;
}

const MapComponentClient = forwardRef<MapComponentRef, MapComponentProps>(({ alerts, onAlertClick }, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);

  // Helper function to add markers to map
  const addMarkersToMap = useCallback((L: any, shouldFitBounds = false) => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    alerts
      .filter(alert => {
        // Handle both old format (gps) and new format (location)
        return alert.gps || alert.location;
      })
      .forEach(alert => {
        // Get coordinates from either old or new format
        const coords = alert.gps ? [alert.gps.lat, alert.gps.lon] : 
                      alert.location ? [alert.location.latitude, alert.location.longitude] : null;
        
        
        if (!coords) {
          return;
        }
        
        const marker = L.marker(coords)
          .addTo(mapRef.current)
          .bindPopup(`
            <div>
              <b>User:</b> ${alert.userId || (alert as any).user_id}<br />
              <b>Time:</b> ${new Date(alert.receivedAt || (alert as any).created_at).toLocaleTimeString()}
              ${alert.batteryLevel ? `<br /><b>Battery:</b> ${alert.batteryLevel}%` : ''}
              ${(alert as any).message ? `<br /><b>Message:</b> ${(alert as any).message}` : ''}
            </div>
          `);
        
        // Store the alert data with the marker for reliable identification
        (marker as any).alertData = alert;
        
        marker.on('click', () => {
          // Zoom to marker and open popup on single click
          const currentZoom = mapRef.current.getZoom();
          // Only zoom in if we're zoomed out too far, otherwise use current zoom
          const targetZoom = currentZoom < 10 ? 10 : currentZoom;
          mapRef.current.flyTo(coords, targetZoom);
          marker.openPopup();
          
          if (onAlertClick) {
            onAlertClick(alert);
          }
        });
        
        markersRef.current.push(marker);
      });

    // Only fit bounds if explicitly requested (e.g., on initial load)
    if (shouldFitBounds) {
      const alertsWithLocation = alerts.filter(alert => alert.gps || alert.location);
      if (alertsWithLocation.length > 0) {
        const bounds = alertsWithLocation.map(alert => {
          if (alert.gps) {
            return [alert.gps.lat, alert.gps.lon] as [number, number];
          } else if (alert.location) {
            return [alert.location.latitude, alert.location.longitude] as [number, number];
          }
          return null;
        }).filter(coord => coord !== null) as [number, number][];
        
        if (bounds.length > 0) {
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    }
  }, [alerts, onAlertClick]);

  // Function to open popup for a specific alert
  const openPopupForAlert = useCallback((alert: Alert) => {
    // Get coordinates from either old or new format
    const coords = alert.gps ? [alert.gps.lat, alert.gps.lon] : 
                  alert.location ? [alert.location.latitude, alert.location.longitude] : null;
    
    if (!mapRef.current || !coords) return;
    
    // Find marker by stored alert data instead of coordinates
    const marker = markersRef.current.find(m => {
      const storedAlert = (m as any).alertData;
      return storedAlert && storedAlert.id === alert.id;
    });
    
    
    if (marker) {
      // Close all other popups first
      markersRef.current.forEach(m => m.closePopup());
      
      // Force the popup to open immediately with multiple attempts
      const openPopup = () => {
        if (marker && mapRef.current) {
          try {
            marker.openPopup();
            mapRef.current.invalidateSize();
          } catch (error) {
            console.error('Error opening popup:', error);
          }
        }
      };
      
      // Try to open immediately
      openPopup();
      
      // Try again after a very short delay to ensure it opens
      setTimeout(openPopup, 10);
      
      // Start the flyTo animation
      const currentZoom = mapRef.current.getZoom();
      // Only zoom in if we're zoomed out too far, otherwise use current zoom
      const targetZoom = currentZoom < 10 ? 10 : currentZoom;
      mapRef.current.flyTo(coords, targetZoom);
      
      // Ensure popup stays visible during and after animation
      setTimeout(openPopup, 100);
      setTimeout(openPopup, 300);
    }
  }, []);

  // Expose the function through ref
  useImperativeHandle(ref, () => ({
    openPopupForAlert
  }), [openPopupForAlert]);

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
      
      // Add markers immediately after map initialization with bounds fitting
      addMarkersToMap(L.default, true);
    });
  }, [isMounted]);

  // Update markers when alerts change
  useEffect(() => {
    if (!mapRef.current || !isInitializedRef.current) return;

    // Import Leaflet to get the marker function
    import('leaflet').then((L) => {
      // Don't fit bounds when updating markers (e.g., when toggling views)
      addMarkersToMap(L.default, false);
    });
  }, [alerts, onAlertClick, addMarkersToMap]);

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
});

MapComponentClient.displayName = 'MapComponentClient';

export default MapComponentClient;

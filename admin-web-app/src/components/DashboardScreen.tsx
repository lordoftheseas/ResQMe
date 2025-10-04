'use client';

import { useState, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';
import { Alert } from '../types';
import { MapComponentRef } from './MapComponentClient';

interface DashboardScreenProps {
  onLogout: () => void;
}

export default function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const mapRef = useRef<MapComponentRef>(null);
  
  // Initialize with mock data immediately to prevent loading delays
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      userId: 'User_001',
      gps: { lat: 42.3736 + 0.01, lon: -71.1097 + 0.01 },
      receivedAt: new Date().toISOString(),
      synced: true,
      batteryLevel: 85
    },
    {
      id: 2,
      userId: 'User_002',
      gps: { lat: 42.3736 - 0.005, lon: -71.1097 + 0.02 },
      receivedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      synced: true,
      batteryLevel: 42
    },
    {
      id: 3,
      userId: 'User_003',
      gps: { lat: 42.3736 + 0.02, lon: -71.1097 - 0.01 },
      receivedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      synced: false,
      batteryLevel: 78
    }
  ]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      alert('Please enter a message to broadcast.');
      return;
    }
    
    // Mock broadcast - replace with actual API call
    console.log('Broadcasting message:', broadcastMessage);
    alert('Message sent successfully!');
    setBroadcastMessage('');
  };

  const handleSync = async () => {
    // Mock sync - replace with actual API call
    console.log('Syncing data...');
    alert('Data synced successfully!');
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    // Open popup on map for the clicked alert
    if (mapRef.current) {
      mapRef.current.openPopupForAlert(alert);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getSeverityLevel = (timeSinceAlert: number, distance: number): string => {
    const minutesSinceAlert = timeSinceAlert / (1000 * 60);
    
    if (minutesSinceAlert < 5 && distance < 1) return 'Danger';
    if (minutesSinceAlert < 15 && distance < 5) return 'Caution';
    return 'Safe';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Danger': return 'bg-red-600 text-white';
      case 'Caution': return 'bg-yellow-600 text-white';
      case 'Safe': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (!a.gps || !b.gps) return 0;
    const adminLat = 42.3736;
    const adminLon = -71.1097;
    const distanceA = calculateDistance(adminLat, adminLon, a.gps.lat, a.gps.lon);
    const distanceB = calculateDistance(adminLat, adminLon, b.gps.lat, b.gps.lon);
    return distanceA - distanceB;
  });

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">ResQMe Admin Dashboard</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            >
              Sync Data
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Map */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
            <h2 className="text-lg font-semibold text-white">Emergency Requests Map</h2>
            <p className="text-sm text-gray-400">Real-time location of distress signals</p>
          </div>
          <div className="flex-1 bg-gray-700">
            <MapComponent ref={mapRef} alerts={alerts} onAlertClick={handleAlertClick} />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Nearby People List */}
          <div className="flex-1 border-b border-gray-700">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Nearby People</h3>
              <p className="text-sm text-gray-400">Closest emergency requests</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sortedAlerts.length === 0 ? (
                <p className="text-gray-500">No requests detected yet.</p>
              ) : (
                sortedAlerts.map(alert => {
                  if (!alert.gps) return null;
                  
                  const adminLat = 42.3736;
                  const adminLon = -71.1097;
                  const distance = calculateDistance(adminLat, adminLon, alert.gps.lat, alert.gps.lon);
                  const timeSinceAlert = Date.now() - new Date(alert.receivedAt).getTime();
                  const severity = getSeverityLevel(timeSinceAlert, distance);
                  
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-md cursor-pointer border-l-4 hover:bg-gray-700 ${
                        selectedAlert?.id === alert.id ? 'bg-gray-700' : 'bg-gray-800'
                      }`}
                      style={{ borderColor: alert.synced ? '#10B981' : '#F59E0B' }}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-sm">{alert.userId}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(severity)}`}>
                            {severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(alert.receivedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">Distance: {distance.toFixed(1)} km</p>
                      <p className="text-xs text-gray-500">
                        Lat: {alert.gps.lat.toFixed(4)}, Lon: {alert.gps.lon.toFixed(4)}
                      </p>
                      {alert.batteryLevel && (
                        <p className="text-xs text-gray-500">Battery: {alert.batteryLevel}%</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Message Broadcasting */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Send Alert Message</h3>
            <div className="space-y-3">
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter emergency message to broadcast to all nearby devices..."
                className="w-full h-20 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleBroadcast}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors"
              >
                Send Emergency Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

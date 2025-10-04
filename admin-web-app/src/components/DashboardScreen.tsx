'use client';

import { useState, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';
import { Alert, Message } from '../types';
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
      batteryLevel: 85,
      isSOS: true,
      message: 'Emergency! Need immediate help!'
    },
    {
      id: 2,
      userId: 'User_002',
      gps: { lat: 42.3736 - 0.005, lon: -71.1097 + 0.02 },
      receivedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      synced: true,
      batteryLevel: 42,
      isSOS: false,
      message: 'Lost in the woods, need directions',
      messageHistory: [
        {
          id: 1,
          content: 'Hello, I need help finding my way back to the main road',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        },
        {
          id: 2,
          content: 'We received your message. Can you describe your surroundings?',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          isFromUser: false,
          messageType: 'text'
        },
        {
          id: 3,
          content: 'I see tall pine trees and a small stream nearby',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        },
        {
          id: 4,
          content: 'Based on your location, head north for about 200 meters to reach the main trail',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isFromUser: false,
          messageType: 'text'
        },
        {
          id: 5,
          content: 'Lost in the woods, need directions',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        }
      ]
    },
    {
      id: 3,
      userId: 'User_003',
      gps: { lat: 42.3736 + 0.02, lon: -71.1097 - 0.01 },
      receivedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      synced: false,
      batteryLevel: 78,
      isSOS: true,
      message: 'Car accident, need medical assistance'
    },
    {
      id: 4,
      userId: 'User_004',
      gps: { lat: 42.3736 - 0.01, lon: -71.1097 - 0.02 },
      receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      synced: true,
      batteryLevel: 65,
      isSOS: false,
      message: 'Need help finding my way back to the main road',
      messageHistory: [
        {
          id: 1,
          content: 'I think I took a wrong turn and now I\'m lost',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        },
        {
          id: 2,
          content: 'Don\'t worry, we\'ll help you get back on track. What landmarks do you see?',
          timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          isFromUser: false,
          messageType: 'text'
        },
        {
          id: 3,
          content: 'I can see a red barn in the distance and some power lines',
          timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        },
        {
          id: 4,
          content: 'Need help finding my way back to the main road',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        }
      ]
    },
    {
      id: 5,
      userId: 'User_005',
      gps: { lat: 42.3736 + 0.03, lon: -71.1097 + 0.03 },
      receivedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      synced: true,
      batteryLevel: 92,
      isSOS: false,
      message: 'Can someone help me with directions to the nearest gas station?',
      messageHistory: [
        {
          id: 1,
          content: 'My car is running low on fuel and I need to find a gas station',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        },
        {
          id: 2,
          content: 'We can help you find the nearest gas station. What\'s your current location?',
          timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          isFromUser: false,
          messageType: 'text'
        },
        {
          id: 3,
          content: 'I\'m near the shopping mall on Main Street',
          timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        },
        {
          id: 4,
          content: 'Can someone help me with directions to the nearest gas station?',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          isFromUser: true,
          messageType: 'text'
        }
      ]
    }
  ]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeView, setActiveView] = useState<'sos' | 'messages'>('sos');
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<Alert | null>(null);
  const [newMessage, setNewMessage] = useState('');

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

  const toggleMessageExpansion = (alertId: number) => {
    setExpandedMessage(expandedMessage === alertId ? null : alertId);
  };

  const openChat = (alert: Alert) => {
    setSelectedChatUser(alert);
  };

  const closeChat = () => {
    setSelectedChatUser(null);
    setNewMessage('');
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChatUser) return;
    
    // Add new message to the conversation
    const newMsg: Message = {
      id: Date.now(),
      content: newMessage,
      timestamp: new Date().toISOString(),
      isFromUser: false,
      messageType: 'text'
    };

    // Update the alert with the new message
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === selectedChatUser.id 
          ? {
              ...alert,
              messageHistory: [...(alert.messageHistory || []), newMsg]
            }
          : alert
      )
    );

    setNewMessage('');
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

  const sortedAlerts = [...alerts]
    .filter(alert => {
      // Filter based on active view
      if (activeView === 'sos' && alert.isSOS) return true;
      if (activeView === 'messages' && alert.message && !alert.isSOS) return true;
      return false;
    })
    .sort((a, b) => {
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
              <h3 className="text-lg font-semibold text-white">Emergency Requests</h3>
              <p className="text-sm text-gray-400">Real-time emergency alerts and messages</p>
              
              {/* Navigation Tabs */}
              <div className="flex space-x-1 mt-3 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('sos')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'sos'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🚨</span>
                    <span>SOS</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveView('messages')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'messages'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>💬</span>
                    <span>Messages</span>
                  </span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
              {selectedChatUser ? (
                // Chat Interface
                <div className="h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {selectedChatUser.userId.charAt(selectedChatUser.userId.length - 1)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{selectedChatUser.userId}</h4>
                        <p className="text-xs text-gray-400">
                          {selectedChatUser.batteryLevel && `Battery: ${selectedChatUser.batteryLevel}%`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeChat}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-800">
                    {selectedChatUser.messageHistory?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isFromUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.isFromUser
                              ? 'bg-gray-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-3 bg-gray-700 rounded-b-lg">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : sortedAlerts.length === 0 ? (
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
                          {alert.isSOS && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-600 text-white font-bold">
                              SOS
                            </span>
                          )}
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
                      {alert.message && (
                        <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                          <p className="text-gray-300 font-medium">
                            {alert.isSOS ? 'SOS Message:' : 'Message:'}
                          </p>
                          <p className="text-gray-400">
                            {expandedMessage === alert.id ? alert.message : 
                             alert.message.length > 100 ? alert.message.substring(0, 100) + '...' : alert.message}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            {alert.message.length > 100 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageExpansion(alert.id);
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                              >
                                {expandedMessage === alert.id ? 'Show Less' : 'Show More'}
                              </button>
                            )}
                            {alert.messageHistory && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChat(alert);
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                              >
                                View Chat
                              </button>
                            )}
                          </div>
                        </div>
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

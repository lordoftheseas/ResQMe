'use client';

import React, { useState, useRef, useEffect } from 'react';
import MapComponent from './MapComponent';
import { Alert, Message } from '../types';
import { MapComponentRef } from './MapComponentClient';
import { SosAlert, SupabaseDB } from '@/lib/database';
import { supabase } from '@/lib/supabase';

interface DashboardScreenProps {
  onLogout: () => void;
}

export default function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const mapRef = useRef<MapComponentRef>(null);
  
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [messages, setMessages] = useState<SosAlert[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SosAlert | null>(null);
  const [activeView, setActiveView] = useState<'sos' | 'messages'>('sos');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<SosAlert | null>(null);
  const [chatHistory, setChatHistory] = useState<SosAlert[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      const alerts = await SupabaseDB.getSosSignalswithUser();
      // console.log(alerts.data);
      setSosAlerts(alerts.data || []);
    };
    fetchAlerts();
  }, []);

  React.useEffect(() => {
    const fetchMessages = async () => {
      const messages = await SupabaseDB.getMessages();
      // console.log('Messages:', messages.data);
      setMessages(messages.data || []);
    };
    fetchMessages();
  }, []);

  // Live subscription for SOS alerts - simplified without filters first
  React.useEffect(() => {
    console.log('Setting up SOS alerts subscription...');
    const sosSubscription = supabase
      .channel('sos-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'esp_signals'
        },
        async (payload) => {
          console.log('SOS Alert change detected:', payload);
          console.log('Event type:', payload.eventType);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);
          
          // Check if it's actually a SOS message
          const isNewSos = (payload.new as any)?.message?.includes('SOS Help Needed');
          const isOldSos = (payload.old as any)?.message?.includes('SOS Help Needed');
          
          if (isNewSos || isOldSos) {
            setIsLiveUpdating(true);
            
            if (payload.eventType === 'DELETE') {
              // Remove the deleted item from state
              console.log('Removing deleted SOS alert from state');
              setSosAlerts(prevAlerts => 
                prevAlerts.filter(alert => alert.id !== (payload.old as any)?.id)
              );
            } else if (payload.eventType === 'INSERT') {
              // Add the new item to state
              console.log('Adding new SOS alert to state');
              const alerts = await SupabaseDB.getSosSignalswithUser();
              setSosAlerts(alerts.data || []);
            } else if (payload.eventType === 'UPDATE') {
              // Update the existing item in state
              console.log('Updating SOS alert in state');
              const alerts = await SupabaseDB.getSosSignalswithUser();
              setSosAlerts(alerts.data || []);
            } else {
              // Fallback: refresh entire list
              console.log('Refreshing entire SOS alerts list');
              const alerts = await SupabaseDB.getSosSignalswithUser();
              setSosAlerts(alerts.data || []);
            }
            
            setTimeout(() => setIsLiveUpdating(false), 1000);
          }
        }
      )
      .subscribe((status) => {
        console.log('SOS subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from SOS alerts...');
      sosSubscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    console.log('Setting up messages subscription...');
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'esp_signals'
        },
        async (payload) => {
          console.log('Message change detected:', payload);
          console.log('Event type:', payload.eventType);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);
          
          // Check if it's NOT a SOS message
          const isNewMessage = (payload.new as any)?.message && !(payload.new as any)?.message?.includes('SOS Help Needed');
          const isOldMessage = (payload.old as any)?.message && !(payload.old as any)?.message?.includes('SOS Help Needed');
          
          if (isNewMessage || isOldMessage) {
            setIsLiveUpdating(true);
            
            if (payload.eventType === 'DELETE') {
              // Remove the deleted item from state
              console.log('Removing deleted message from state');
              setMessages(prevMessages => 
                prevMessages.filter(message => message.id !== (payload.old as any)?.id)
              );
            } else if (payload.eventType === 'INSERT') {
              // Add the new item to state
              console.log('Adding new message to state');
              const messages = await SupabaseDB.getMessages();
              setMessages(messages.data || []);
            } else if (payload.eventType === 'UPDATE') {
              // Update the existing item in state
              console.log('Updating message in state');
              const messages = await SupabaseDB.getMessages();
              setMessages(messages.data || []);
            } else {
              // Fallback: refresh entire list
              console.log('Refreshing entire messages list');
              const messages = await SupabaseDB.getMessages();
              setMessages(messages.data || []);
            }
            
            setTimeout(() => setIsLiveUpdating(false), 1000);
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from messages...');
      messagesSubscription.unsubscribe();
    };
  }, []);

  // Live subscription for sos_alerts table (broadcast messages)
  React.useEffect(() => {
    console.log('Setting up sos_alerts table subscription...');
    const sosAlertsSubscription = supabase
      .channel('sos-alerts-table')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts'
        },
        async (payload) => {
          console.log('SOS Alerts table change detected:', payload);
          console.log('Event type:', payload.eventType);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);
          
          setIsLiveUpdating(true);
          
          if (payload.eventType === 'DELETE') {
            console.log('Broadcast message deleted - refreshing both lists');
          } else if (payload.eventType === 'INSERT') {
            console.log('New broadcast message added - refreshing both lists');
          } else if (payload.eventType === 'UPDATE') {
            console.log('Broadcast message updated - refreshing both lists');
          } else {
            console.log('Broadcast message change - refreshing both lists');
          }
          
          // Refresh both SOS alerts and messages when broadcast messages change
          const alerts = await SupabaseDB.getSosSignalswithUser();
          setSosAlerts(alerts.data || []);
          
          const messages = await SupabaseDB.getMessages();
          setMessages(messages.data || []);
          
          setTimeout(() => setIsLiveUpdating(false), 1000);
        }
      )
      .subscribe((status) => {
        console.log('SOS Alerts table subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from sos_alerts table...');
      sosAlertsSubscription.unsubscribe();
    };
  }, []);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      alert('Please enter a message to broadcast.');
      return;
    }    
    try {
      const { data, error } = await SupabaseDB.createSosAlertInTable("ALERT: " + broadcastMessage);
      
      if (error) {
        console.error('Error creating SOS alert:', error);
        alert('Failed to send emergency alert. Please try again.');
        return;
      }
      alert('Emergency alert sent successfully!');
      setBroadcastMessage('');
      
      // Refresh the alerts list to show the new alert
      const alerts = await SupabaseDB.getSosSignalswithUser();
      setSosAlerts(alerts.data || []);
      
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      alert('Failed to send emergency alert. Please try again.');
    }
  };

  const handleAlertClick = (alert: SosAlert) => {
    setSelectedAlert(alert);
    // Open popup on map for the clicked alert
    if (mapRef.current) {
      mapRef.current.openPopupForAlert(alert as any);
    }
  };

  const toggleMessageExpansion = (alertId: string) => {
    setExpandedMessage(expandedMessage === alertId ? null : alertId);
  };

  const openChat = async (alert: SosAlert) => {
    setSelectedChatUser(alert);
    if (alert.user_id) {
      const history = await SupabaseDB.getChatHistory(alert.user_id);
      setChatHistory(history.data || []);
    }
  };

  const closeChat = () => {
    setSelectedChatUser(null);
    setChatHistory([]);
    setNewMessage('');
  };

  // Test function to trigger subscription
  const testSubscription = async () => {
    console.log('Testing subscription by inserting test data...');
    try {
      // First test basic connection
      const { data: testData, error: testError } = await supabase
        .from('esp_signals')
        .select('*')
        .limit(1);
      
      console.log('Basic connection test:', { testData, testError });
      
      if (testError) {
        console.error('Connection test failed:', testError);
        return;
      }
      
      // Now try to insert test data
      const { data, error } = await supabase
        .from('esp_signals')
        .insert({
          device_id: 'test-device-' + Date.now(),
          user_id: 'test-user',
          message: 'Test message for subscription',
          type: 'message',
          status: 'online',
          sensors: { gps: { latitude: 42.3736, longitude: -71.1097 } }
        });
      
      if (error) {
        console.error('Test insert error:', error);
      } else {
        console.log('Test data inserted successfully:', data);
      }
    } catch (error) {
      console.error('Test subscription error:', error);
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

  const sortedAlerts = (activeView === 'sos' ? sosAlerts : messages)
    .filter(alert => {
      // Filter based on active view
      if (activeView === 'sos' && alert.type === 'sos') return true;
      if (activeView === 'messages' && alert.type === 'message') return true;
      return false;
    })
    .sort((a, b) => {
      if (!a.location || !b.location) return 0;
      const adminLat = 42.3736;
      const adminLon = -71.1097;
      const distanceA = calculateDistance(adminLat, adminLon, a.location.latitude, a.location.longitude);
      const distanceB = calculateDistance(adminLat, adminLon, b.location.latitude, b.location.longitude);
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
            {isLiveUpdating && (
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {}}
              disabled={isSyncing}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                isSyncing 
                  ? 'bg-blue-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <span>Sync Data</span>
              )}
            </button>
            <button
              onClick={testSubscription}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            >
              Test Subscription
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
            <MapComponent ref={mapRef} alerts={sosAlerts as any} onAlertClick={handleAlertClick as any} />
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
                          {selectedChatUser.user?.first_name?.charAt(0) || selectedChatUser.userId?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">
                          {selectedChatUser.user ? `${selectedChatUser.user.first_name} ${selectedChatUser.user.last_name}` : selectedChatUser.userId}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {selectedChatUser.user?.phone_number && `Phone: ${selectedChatUser.user.phone_number}`}
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
                </div>
              ) : sortedAlerts.length === 0 ? (
                <p className="text-gray-500">No requests detected yet.</p>
              ) : (
                sortedAlerts.map(alert => {
                  if (!alert.message) return null;
                  
                  const adminLat = 42.3736;
                  const adminLon = -71.1097;
                  const distance = alert.location ? calculateDistance(adminLat, adminLon, alert.location.latitude, alert.location.longitude) : 0;
                  const timeSinceAlert = Date.now() - new Date(alert.created_at).getTime();
                  const severity = getSeverityLevel(timeSinceAlert, distance);
                  
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-md cursor-pointer border-l-4 hover:bg-gray-700 ${
                        selectedAlert?.id === alert.id ? 'bg-gray-700' : 'bg-gray-800'
                      }`}
                      style={{ borderColor: alert.status === 'online' ? '#10B981' : '#F59E0B' }}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-sm">
                            {alert.user ? `${alert.user.first_name} ${alert.user.last_name}` : (alert.userId || alert.user_id)}
                          </p>
                          {alert.type === 'sos' && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-600 text-white font-bold">
                              SOS
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(severity)}`}>
                            {severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">Distance: {distance.toFixed(1)} km</p>
                      {alert.location && (
                        <p className="text-xs text-gray-500">
                          Lat: {alert.location.latitude.toFixed(4)}, Lon: {alert.location.longitude.toFixed(4)}
                        </p>
                      )}
                      {alert.user?.phone_number && (
                        <p className="text-xs text-gray-500">Phone: {alert.user.phone_number}</p>
                      )}
                      {/* Battery status removed */}
                      {alert.message && alert.type !== 'sos' && (
                        <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                          <p className="text-gray-300 font-medium">Message:</p>
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openChat(alert as any);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            >
                              View Chat
                            </button>
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
              <div className="relative">
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 55) {
                      setBroadcastMessage(value);
                    }
                  }}
                  placeholder="Enter emergency message to broadcast to all nearby devices..."
                  className={`w-full h-20 px-3 py-2 bg-gray-900 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                    broadcastMessage.length > 50 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-blue-500'
                  }`}
                  maxLength={55}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  <span className={broadcastMessage.length > 50 ? 'text-red-400' : 'text-gray-400'}>
                    {broadcastMessage.length}/55
                  </span>
                </div>
              </div>
              <button
                onClick={handleBroadcast}
                disabled={!broadcastMessage.trim() || broadcastMessage.length > 55}
                className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
                  !broadcastMessage.trim() || broadcastMessage.length > 55
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
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
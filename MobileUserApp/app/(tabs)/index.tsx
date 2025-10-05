import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, Vibration, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLastSyncTime(new Date());
  }, []);

  const handleSendSOS = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`http://192.168.4.1/submit_sos?msg=SOS%20Help%20Needed`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    console.log(data);
  };

  const handleSOS = () => {
    Alert.alert(
      'SOS Emergency',
      'Are you sure you want to send an emergency SOS signal? This will alert emergency services and your contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send SOS', 
          style: 'destructive',
          onPress: () => {
            handleSendSOS();
            setIsSOSActive(true);
            Vibration.vibrate([0, 1000, 500, 1000]);
            setTimeout(() => {
              setIsSOSActive(false);
              Alert.alert('SOS Sent', 'Emergency SOS signal has been sent to emergency services and your contacts.');
            }, 2000);
          }
        }
      ]
    );
  };

  const handleSyncData = async () => {
    try {
      setSyncStatus('syncing');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://192.168.4.1/set_user_id?userid=${user?.id}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log(data);
      
      setLastSyncTime(new Date());
      setSyncStatus('success');
      
      setTimeout(() => {
        setSyncStatus('idle');
        Alert.alert('Sync Complete', 'Your data has been successfully synced to the cloud.');
      }, 1000);
      
    } catch (error) {
      setSyncStatus('error');
    }
  };   

  const handleHelpMessage = () => {
    setIsMessageModalVisible(true);
  };

  const sendHelpMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message before sending.');
      return;
    }

    setIsMessageModalVisible(false);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
      const response = await fetch(`http://192.168.4.1/submit_sos?msg=${encodeURIComponent(message)}`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log(data)
      Alert.alert('Help Sent', 'Help message has been sent to your emergency contacts.');
      setMessage(''); // Clear the message after sending
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
            <ThemedText style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</ThemedText>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Cards */}
        <ThemedView style={styles.statusContainer}>
          <ThemedView style={styles.statusCard}>
            <ThemedText style={styles.statusTitle}>Last Sync</ThemedText>
            <ThemedText style={styles.statusValue}>
              {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statusCard}>
            <ThemedText style={styles.statusTitle}>Status</ThemedText>
            <ThemedText style={[styles.statusValue, styles.statusOnline]}>Offline</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Main Features */}
        <ThemedView style={styles.featuresContainer}>
          {/* SOS Button */}
          <TouchableOpacity 
            style={[styles.featureCard, styles.sosCard, isSOSActive && styles.sosActive]} 
            onPress={handleSOS}
            disabled={isSOSActive}
          >
            <LinearGradient
              colors={isSOSActive ? ['#ff6b6b', '#ee5a52'] : ['#ff4757', '#ff3742']}
              style={styles.featureGradient}
            >
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureIcon}>⚠️</ThemedText>
                <ThemedText style={styles.featureTitle}>SOS Emergency</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  {isSOSActive ? 'Sending SOS...' : 'Send emergency signal'}
                </ThemedText>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sync Data Button */}
          <TouchableOpacity 
            style={[styles.featureCard, styles.syncCard]} 
            onPress={handleSyncData}
            disabled={syncStatus === 'syncing'}
          >
            <LinearGradient
              colors={syncStatus === 'syncing' ? ['#74b9ff', '#0984e3'] : ['#00b894', '#00a085']}
              style={styles.featureGradient}
            >
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureIcon}>
                  {syncStatus === 'syncing' ? '⟳' : '☁'}
                </ThemedText>
                <ThemedText style={styles.featureTitle}>
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}
                </ThemedText>
                <ThemedText style={styles.featureDescription}>
                  {syncStatus === 'syncing' ? 'Uploading to cloud' : 'Sync to cloud storage'}
                </ThemedText>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Help Message Button */}
          <TouchableOpacity 
            style={[styles.featureCard, styles.helpCard]} 
            onPress={handleHelpMessage}
          >
            <LinearGradient
              colors={['#fdcb6e', '#e17055']}
              style={styles.featureGradient}
            >
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureIcon}>📱</ThemedText>
                <ThemedText style={styles.featureTitle}>Help Message</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Send help to contacts
                </ThemedText>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      {/* Message Recording Modal */}
      <Modal
        visible={isMessageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsMessageModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Record Help Message</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Enter your emergency message below:
            </ThemedText>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Type your emergency message here..."
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsMessageModalVisible(false);
                  setMessage('');
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={sendHelpMessage}
              >
                <ThemedText style={styles.sendButtonText}>Send Help</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  statusOnline: {
    color: '#00b894',
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 30,
  },
  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureGradient: {
    padding: 20,
  },
  featureContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 36,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  sosCard: {
    // Special styling for SOS
  },
  sosActive: {
    transform: [{ scale: 1.05 }],
  },
  syncCard: {
    // Special styling for sync
  },
  helpCard: {
    // Special styling for help
  },
  quickActions: {
    marginTop: 20,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2d3436',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d3436',
    backgroundColor: '#f8f9fa',
    textAlignVertical: 'top',
    minHeight: 80,
    maxHeight: 120,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636e72',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
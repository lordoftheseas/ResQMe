import { contextBridge } from 'electron';

// Mock API for testing
contextBridge.exposeInMainWorld('api', {
    isOnline: (): boolean => true,
    onNewAlert: (callback: (alert: any) => void) => {
        // Mock implementation - just store the callback
        console.log('onNewAlert callback registered');
    },
    onOnlineStatusChange: (callback: (isOnline: boolean) => void) => {
        // Mock implementation
        console.log('onOnlineStatusChange callback registered');
    },
    getAllAlerts: (): Promise<any[]> => Promise.resolve([]),
    broadcastMessage: (message: string): Promise<{ success: boolean; message: string }> => {
        console.log('Broadcasting message:', message);
        return Promise.resolve({ success: true, message: 'Message sent successfully' });
    },
    syncOnline: (): Promise<{ success: boolean; message: string }> => {
        console.log('Syncing data online');
        return Promise.resolve({ success: true, message: 'Data synced successfully' });
    }
});

declare global {
  interface Window {
    api: {
      isOnline: () => boolean;
      onNewAlert: (callback: (alert: any) => void) => void;
      onOnlineStatusChange: (callback: (isOnline: boolean) => void) => void;
      getAllAlerts: () => Promise<any[]>;
      broadcastMessage: (message: string) => Promise<{ success: boolean; message: string }>;
      syncOnline: () => Promise<{ success: boolean; message: string }>;
    }
  }
}

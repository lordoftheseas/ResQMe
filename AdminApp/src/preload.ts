import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Alert } from './types';

contextBridge.exposeInMainWorld('api', {
    listSerialPorts: (): Promise<any[]> => ipcRenderer.invoke('serial:list-ports'),
    connectToPort: (portPath: string): Promise<{ success: boolean; message: string; }> => ipcRenderer.invoke('serial:connect', portPath),
    broadcastMessage: (message: string): Promise<{ success: boolean; message: string; }> => ipcRenderer.invoke('serial:broadcast-message', message),
    onSerialStatus: (callback: (status: { connected: boolean; port: string | null; error?: string }) => void) => {
      ipcRenderer.on('serial:status', (_event: IpcRendererEvent, value: any) => callback(value));
    },
    onNewAlert: (callback: (alert: Alert) => void) => {
      ipcRenderer.on('new-alert', (_event: IpcRendererEvent, value: any) => callback(value));
    },
    syncOnline: (): Promise<{ success: boolean; message: string; }> => ipcRenderer.invoke('data:sync-online'),
    getAllAlerts: (): Promise<Alert[]> => ipcRenderer.invoke('data:get-all-alerts'),
    onOnlineStatusChange: (callback: (isOnline: boolean) => void) => {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    },
    isOnline: (): boolean => navigator.onLine,
});

declare global {
  interface Window {
    api: {
      listSerialPorts: () => Promise<any[]>;
      connectToPort: (portPath: string) => Promise<{ success: boolean; message: string; }>;
      broadcastMessage: (message: string) => Promise<{ success: boolean; message: string; }>;
      onSerialStatus: (callback: (status: { connected: boolean; port: string | null; error?: string }) => void) => void;
      onNewAlert: (callback: (alert: Alert) => void) => void;
      syncOnline: () => Promise<{ success: boolean; message: string; }>;
      getAllAlerts: () => Promise<Alert[]>;
      onOnlineStatusChange: (callback: (isOnline: boolean) => void) => void;
      isOnline: () => boolean;
    }
  }
}

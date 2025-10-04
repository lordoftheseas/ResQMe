import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import dbManager from './database/dbManager';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Alert } from './types';

let mainWindow: BrowserWindow | null = null;
let serialPort: SerialPort | null = null;
let parser: ReadlineParser | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.webContents.openDevTools(); // Uncomment for debugging
}

app.whenReady().then(() => {
    dbManager.init().then(() => {
        console.log('Database initialized successfully.');
        createWindow();
    }).catch(err => {
        console.error('Failed to initialize database:', err);
        app.quit();
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (serialPort && serialPort.isOpen) serialPort.close(); });

ipcMain.handle('serial:list-ports', async () => {
    try {
        return await SerialPort.list();
    } catch (error) {
        console.error('Error listing serial ports:', error);
        return [];
    }
});

ipcMain.handle('serial:connect', (event: IpcMainInvokeEvent, portPath: string) => {
    if (serialPort && serialPort.isOpen) serialPort.close();
    if (!portPath) return { success: false, message: 'Port path is required.' };
    try {
        serialPort = new SerialPort({ path: portPath, baudRate: 115200 });
        parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

        serialPort.on('open', () => {
            console.log(`Serial port ${portPath} opened.`);
            mainWindow?.webContents.send('serial:status', { connected: true, port: portPath });
        });

        parser.on('data', (data: string) => {
            console.log('Data from ESP32:', data);
            try {
                const incomingData: Partial<Alert> = JSON.parse(data);
                const alertData: Omit<Alert, 'id'> = {
                    userId: incomingData.userId || 'User' + Math.floor(Math.random() * 1000),
                    macAddress: incomingData.macAddress || '00:1B:44:11:3A:B7',
                    gps: incomingData.gps || { lat: 42.3601 + (Math.random() - 0.5) * 0.1, lon: -71.0589 + (Math.random() - 0.5) * 0.1 },
                    receivedAt: new Date().toISOString(),
                    synced: false,
                    messageType: 'SOS',
                    batteryLevel: Math.floor(Math.random() * 100),
                };
                dbManager.addAlert(alertData).then(newAlert => mainWindow?.webContents.send('new-alert', newAlert));
            } catch (error) {
                console.error('Error parsing JSON from serial port:', error);
            }
        });

        serialPort.on('close', () => {
            console.log(`Serial port ${portPath} closed.`);
            mainWindow?.webContents.send('serial:status', { connected: false, port: null });
        });

        serialPort.on('error', (err) => {
            console.error('Serial Port Error:', err);
            mainWindow?.webContents.send('serial:status', { connected: false, port: null, error: err.message });
        });

        return { success: true, message: `Attempting to connect to ${portPath}` };
    } catch (error) {
        console.error('Failed to connect to serial port:', error);
        return { success: false, message: (error as Error).message };
    }
});

ipcMain.handle('serial:broadcast-message', (event: IpcMainInvokeEvent, message: string) => {
    if (serialPort && serialPort.isOpen) {
        serialPort.write(message + '\n', (err) => {
            if (err) return { success: false, message: err.message };
        });
        return { success: true, message: 'Message broadcasted successfully.' };
    }
    return { success: false, message: 'Serial port not connected.' };
});

ipcMain.handle('data:sync-online', async () => {
    try {
        const unsyncedAlerts = await dbManager.getUnsyncedAlerts();
        if (unsyncedAlerts.length === 0) return { success: true, message: 'All data is already synced.' };
        // This is a placeholder for your actual API call
        console.log('Syncing data:', unsyncedAlerts);
        // const response = await fetch('YOUR_API_ENDPOINT', { ... });
        // if (!response.ok) throw new Error('API Error');
        const alertIds = unsyncedAlerts.map(a => a.id);
        await dbManager.markAlertsAsSynced(alertIds);
        return { success: true, message: `Successfully synced ${unsyncedAlerts.length} alerts.` };
    } catch (error) {
        console.error('Failed to sync data:', error);
        return { success: false, message: (error as Error).message };
    }
});

ipcMain.handle('data:get-all-alerts', async () => dbManager.getAllAlerts());

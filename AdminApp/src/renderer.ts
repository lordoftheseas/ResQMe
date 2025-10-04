import { LoginScreen } from './components/LoginScreen';
import { ScanningScreen } from './components/ScanningScreen';
import { DashboardScreen } from './components/DashboardScreen';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting ResQMe Admin Console');
    // --- App State & Screen Management ---
    const dashboard = new DashboardScreen('dashboard-screen');
    
    const onScanComplete = () => {
        console.log('Scan completed - proceeding to dashboard');
        scanningScreen.stopAutoScanning(); // Stop any auto-scanning
        scanningScreen.hide();
        dashboard.show();
        dashboard.loadInitialAlerts();
    };
    
    const scanningScreen = new ScanningScreen('scanning-screen', onScanComplete);
    
    const onLoginSuccess = () => {
        console.log('Login successful - starting scan');
        loginScreen.hide();
        scanningScreen.startScan(3000); // Simulate a 3-second scan
    };

    const loginScreen = new LoginScreen('login-screen', onLoginSuccess);

    // --- Wire up inter-component events ---
    dashboard.setupLogout(() => {
        console.log('Logout triggered - resetting all screens');
        dashboard.hide();
        scanningScreen.reset(); // Reset scanning screen state
        loginScreen.reset(); // Reset login screen state
        loginScreen.show();
    });

    // --- Global API Listeners from main process ---
    window.api.onNewAlert(alert => {
        if (loginScreen.isHidden()) {
            dashboard.addAlertToList(alert, true);
        }
    });

    window.api.onOnlineStatusChange(isOnline => {
        dashboard.updateOnlineStatus(isOnline);
    });


    // --- Initial State ---
    dashboard.updateOnlineStatus(window.api.isOnline());
    loginScreen.show(); // Start the application on the login screen
    
    // Add some sample data for demo purposes
    setTimeout(() => {
        const sampleAlerts = [
            {
                id: 1,
                userId: 'User_001',
                gps: { lat: 42.3736 + 0.01, lon: -71.1097 + 0.01 },
                receivedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                synced: true,
                messageType: 'SOS',
                batteryLevel: 85
            },
            {
                id: 2,
                userId: 'User_002',
                gps: { lat: 42.3736 - 0.005, lon: -71.1097 + 0.02 },
                receivedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                synced: true,
                messageType: 'Status Check',
                batteryLevel: 92
            },
            {
                id: 3,
                userId: 'User_003',
                gps: { lat: 42.3736 + 0.02, lon: -71.1097 - 0.01 },
                receivedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                synced: false,
                messageType: 'SOS',
                batteryLevel: 45
            }
        ];
        
        // Simulate receiving alerts after dashboard loads
        setTimeout(() => {
            sampleAlerts.forEach((alert, index) => {
                setTimeout(() => {
                    // Directly add alerts to dashboard for demo
                    dashboard.addAlertToList(alert, true);
                }, index * 1000);
            });
        }, 2000);
    }, 1000);
});

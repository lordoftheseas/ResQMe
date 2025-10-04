import { Alert } from '../types';
import { MapComponent } from './MapComponent';

export class DashboardScreen {
    private element: HTMLDivElement;
    private mapComponent: MapComponent;
    private nearbyList: HTMLDivElement;
    private broadcastInput: HTMLTextAreaElement;
    private sendBroadcastButton: HTMLButtonElement;
    private logoutButton: HTMLButtonElement;
    private syncButton: HTMLButtonElement;
    private onlineStatusDiv: HTMLDivElement;
    private allAlerts: { [key: number]: Alert } = {};

    constructor(elementId: string) {
        this.element = document.getElementById(elementId) as HTMLDivElement;
        this.mapComponent = null as any; // Initialize later when dashboard is shown
        this.nearbyList = this.element.querySelector('#nearby-list') as HTMLDivElement;
        this.broadcastInput = this.element.querySelector('#broadcast-message-input') as HTMLTextAreaElement;
        this.sendBroadcastButton = this.element.querySelector('#send-broadcast-button') as HTMLButtonElement;
        this.logoutButton = this.element.querySelector('#logout-button') as HTMLButtonElement;
        this.syncButton = this.element.querySelector('#sync-button') as HTMLButtonElement;
        this.onlineStatusDiv = this.element.querySelector('#online-status') as HTMLDivElement;
        this.init();
    }

    private init(): void {
        this.sendBroadcastButton.addEventListener('click', this.handleBroadcast.bind(this));
        this.syncButton.addEventListener('click', this.handleSync.bind(this));
    }
    
    public setupLogout(callback: () => void) {
        this.logoutButton.addEventListener('click', callback);
    }

    private async handleBroadcast() {
        const message = this.broadcastInput.value;
        if (!message.trim()) {
            alert('Please enter a message to broadcast.');
            return;
        }
        const result = await window.api.broadcastMessage(message);
        alert(result.message);
        if (result.success) this.broadcastInput.value = '';
    }

    private async handleSync() {
        this.syncButton.textContent = 'Syncing...';
        this.syncButton.disabled = true;
        const result = await window.api.syncOnline();
        alert(result.message);
        this.syncButton.textContent = 'Sync Data';
        this.syncButton.disabled = !window.api.isOnline();
        if (result.success) this.loadInitialAlerts();
    }

    public updateOnlineStatus(isOnline: boolean): void {
        this.onlineStatusDiv.textContent = isOnline ? 'Online' : 'Offline';
        this.onlineStatusDiv.classList.toggle('bg-green-500', isOnline);
        this.onlineStatusDiv.classList.toggle('bg-red-500', !isOnline);
        this.syncButton.disabled = !isOnline;
    }

    public async loadInitialAlerts(): Promise<void> {
        const historicalAlerts = await window.api.getAllAlerts();
        this.nearbyList.innerHTML = '';
        this.allAlerts = {};
        historicalAlerts.forEach(alert => this.addAlertToList(alert));
        if (this.mapComponent) {
            this.mapComponent.updateMarkers(historicalAlerts);
        }
        
        if (historicalAlerts.length === 0) {
            this.nearbyList.innerHTML = '<p class="text-gray-500">No requests detected yet.</p>';
        }
    }

    public addAlertToList(alert: Alert, isNew: boolean = false): void {
        if (this.nearbyList.querySelector('.text-gray-500')) this.nearbyList.innerHTML = '';
        this.allAlerts[alert.id] = alert;
        
        // Calculate distance from admin center (assuming admin is at center of map)
        const adminLat = 42.3736; // Default Cambridge, MA
        const adminLon = -71.1097;
        const distance = alert.gps ? this.calculateDistance(adminLat, adminLon, alert.gps.lat, alert.gps.lon) : 0;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `p-3 rounded-md cursor-pointer border-l-4 ${isNew ? 'bg-indigo-900/50 animate-pulse' : 'bg-gray-800'} hover:bg-gray-700`;
        alertDiv.dataset.id = alert.id.toString();
        alertDiv.dataset.distance = distance.toString();
        alertDiv.style.borderColor = alert.synced ? '#10B981' : '#F59E0B';
        
        // Determine severity based on time and distance
        const timeSinceAlert = Date.now() - new Date(alert.receivedAt).getTime();
        const severity = this.getSeverityLevel(timeSinceAlert, distance);
        
        alertDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <p class="font-bold text-sm">${alert.userId}</p>
                    <span class="px-2 py-1 text-xs rounded-full ${this.getSeverityColor(severity)}">${severity}</span>
                </div>
                <p class="text-xs text-gray-400">${new Date(alert.receivedAt).toLocaleTimeString()}</p>
            </div>
            <p class="text-xs text-gray-500">Distance: ${distance.toFixed(1)} km</p>
            <p class="text-xs text-gray-500">Lat: ${alert.gps?.lat.toFixed(4)}, Lon: ${alert.gps?.lon.toFixed(4)}</p>
        `;
        
        alertDiv.addEventListener('click', () => {
            if (alert.gps && this.mapComponent) this.mapComponent.flyTo(alert.gps.lat, alert.gps.lon);
            document.querySelectorAll('#nearby-list > div').forEach(el => el.classList.remove('bg-gray-700'));
            alertDiv.classList.remove('animate-pulse', 'bg-indigo-900/50');
            alertDiv.classList.add('bg-gray-700');
        });
        
        this.nearbyList.appendChild(alertDiv);
        this.sortNearbyList();
        
        if (isNew && this.mapComponent) this.mapComponent.addMarker(alert);
    }
    
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    private getSeverityLevel(timeSinceAlert: number, distance: number): string {
        const minutesSinceAlert = timeSinceAlert / (1000 * 60);
        
        if (minutesSinceAlert < 5 && distance < 1) return 'Danger';
        if (minutesSinceAlert < 15 && distance < 5) return 'Caution';
        return 'Safe';
    }
    
    private getSeverityColor(severity: string): string {
        switch (severity) {
            case 'Danger': return 'bg-red-600 text-white';
            case 'Caution': return 'bg-yellow-600 text-white';
            case 'Safe': return 'bg-green-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    }
    
    private sortNearbyList(): void {
        const alerts = Array.from(this.nearbyList.children) as HTMLElement[];
        alerts.sort((a, b) => {
            const distanceA = parseFloat(a.dataset.distance || '0');
            const distanceB = parseFloat(b.dataset.distance || '0');
            return distanceA - distanceB;
        });
        
        alerts.forEach(alert => this.nearbyList.appendChild(alert));
    }

    public show(): void { 
        console.log('Showing dashboard');
        this.element.classList.remove('hidden');
        // Initialize map component when dashboard is shown
        if (!this.mapComponent) {
            console.log('Initializing map component');
            this.mapComponent = new MapComponent('map-component');
        }
    }
    public hide(): void { this.element.classList.add('hidden'); }
}

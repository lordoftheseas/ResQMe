import { Alert } from '../types';
import 'leaflet';

declare const L: any;

export class MapComponent {
    private map: any;
    private markersLayer: any;

    constructor(elementId: string) {
        this.map = L.map(elementId).setView([42.3736, -71.1097], 13); // Default: Cambridge, MA
        this.markersLayer = L.layerGroup().addTo(this.map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
    }

    public addMarker(alert: Alert): void {
        if (alert.gps) {
            const { lat, lon } = alert.gps;
            const marker = L.marker([lat, lon]);
            marker.bindPopup(`<b>User:</b> ${alert.userId}<br><b>Time:</b> ${new Date(alert.receivedAt).toLocaleTimeString()}`);
            this.markersLayer.addLayer(marker);
        }
    }

    public updateMarkers(alerts: Alert[]): void {
        this.markersLayer.clearLayers();
        alerts.forEach(alert => this.addMarker(alert));
    }

    public flyTo(lat: number, lon: number): void {
        this.map.flyTo([lat, lon], 15);
    }
}

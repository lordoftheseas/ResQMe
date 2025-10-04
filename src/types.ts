export interface Alert {
    id: number;
    userId: string;
    macAddress?: string;
    gps?: {
        lat: number;
        lon: number;
    };
    receivedAt: string;
    synced: boolean;
    messageType?: string;
    batteryLevel?: number;
}

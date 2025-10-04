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

export interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

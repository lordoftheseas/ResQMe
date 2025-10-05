export interface Message {
    id: number;
    content: string;
    timestamp: string;
    isFromUser: boolean; // true if from the user, false if from admin
    messageType: 'text' | 'location' | 'status';
}

export interface Alert {
    id: number;
    userId: string;
    macAddress?: string;
    gps?: {
        lat: number;
        lon: number;
    };
    location?: {
        latitude: number;
        longitude: number;
    };
    receivedAt: string;
    synced: boolean;
    messageType?: string;
    batteryLevel?: number;
    isSOS?: boolean;
    message?: string;
    messageHistory?: Message[];
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

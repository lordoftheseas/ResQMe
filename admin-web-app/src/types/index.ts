export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}


export interface UserInformation {
  id: string;
  user_id: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  disability?: string;
  special_needs?: string;
  weight?: string;
  created_at: string;
  updated_at: string;
}

export interface EspSignals {
    device_id: string;
    user_id: string;
    status: 'online' | 'offline';
    sensors: {
        gps: {
            latitude: number;
            longitude: number;
        };
    };
    message: string;
    type: 'sos' | 'personal';
    created_at: string;
}

export interface SOSAlerts {
    id: string;
    message: string;
    created_at: string;
    updated_at: string;
}


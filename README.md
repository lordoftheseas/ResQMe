# ResQme - Emergency Response System

ResQme is a comprehensive emergency response system designed to provide reliable communication and location tracking during critical situations. The system consists of three interconnected components that work together to ensure rapid emergency response and communication even in areas with limited connectivity.

## 🚨 System Overview

ResQme addresses the critical need for reliable emergency communication by creating a mesh network of ESP32 devices that can operate independently of traditional cellular networks. The system enables users to send SOS signals, communicate with emergency responders, and maintain location tracking through GPS technology.

## 🏗️ Architecture Components

### 1. ESP-32 Mesh Network (`ESP-32-Mesh/`)

The ESP-32 Mesh Network forms the backbone of the ResQme system, providing decentralized communication capabilities.

#### **Core Functionality:**
- **Mesh Network Communication**: Creates a self-healing mesh network using the PainlessMesh library
- **GPS Location Tracking**: Integrates TinyGPSPlus for accurate location data
- **Emergency Button Interface**: Physical button controls for different emergency functions
- **Visual & Audio Feedback**: OLED display and buzzer system for user notifications
- **WiFi Access Point Mode**: Allows mobile app connection for configuration and messaging

#### **Key Features:**
- **Master/Slave Architecture**: One device acts as master, others as clients
- **Automatic Master Discovery**: Clients automatically discover and connect to master nodes
- **Real-time Data Transmission**: Continuous GPS and status data transmission
- **Emergency Alert Broadcasting**: Instant SOS signal propagation across the mesh
- **Dual Mode Operation**: Switches between mesh networking and WiFi AP modes

#### **Hardware Components:**
- ESP32 microcontroller
- GPS module (NEO-6M or similar)
- OLED display (SSD1306)
- Emergency button with multi-click detection
- LED indicators (Blue/Red)
- Buzzer for audio alerts

#### **Button Controls:**
- **Single Click**: Send SOS emergency signal
- **Long Press**: Enter WiFi pairing mode
- **Triple Click**: Switch to mesh networking mode

#### **Technical Specifications:**
- **Mesh Protocol**: PainlessMesh over WiFi
- **GPS Module**: TinyGPSPlus library
- **Display**: Adafruit SSD1306 OLED
- **Communication**: JSON-formatted data packets
- **Power Management**: Optimized for battery operation

### 2. Mobile User Application (`MobileUserApp/`)

A React Native mobile application that provides users with an intuitive interface for emergency communication and device management.

#### **Core Functionality:**
- **Emergency SOS Interface**: One-tap emergency signal transmission
- **Real-time Communication**: Chat with emergency responders
- **Device Status Monitoring**: Battery level, connectivity status, and sync information
- **User Profile Management**: Personal information and emergency contacts
- **Offline Capability**: Works with ESP32 devices even without internet

#### **Key Features:**
- **Cross-Platform**: Built with Expo/React Native for iOS and Android
- **Real-time Updates**: Live synchronization with emergency response system
- **Haptic Feedback**: Vibration patterns for emergency alerts
- **Modern UI**: Clean, accessible interface with Tailwind CSS styling
- **Authentication**: Secure user login and profile management

#### **Technical Stack:**
- **Framework**: React Native with Expo
- **Navigation**: Expo Router with tab-based navigation
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Context API
- **Database**: Supabase integration
- **Authentication**: Supabase Auth

#### **Screens & Components:**
- **Home Screen**: Main emergency interface with SOS button
- **Profile Screen**: User information and settings
- **Authentication**: Login and signup screens
- **Emergency Interface**: Quick access to emergency functions

### 3. Admin Web Application (`admin-web-app/`)

A Next.js web application designed for emergency responders and administrators to monitor and manage emergency situations.

#### **Core Functionality:**
- **Real-time Dashboard**: Live monitoring of all emergency signals and user locations
- **Interactive Map**: Leaflet-based mapping showing user locations and emergency events
- **Emergency Management**: Respond to SOS signals and coordinate rescue operations
- **User Communication**: Direct messaging with users in emergency situations
- **Analytics & Reporting**: Track emergency patterns and response times

#### **Key Features:**
- **Live Data Streaming**: Real-time updates via Supabase subscriptions
- **Geographic Visualization**: Interactive maps with emergency markers
- **Multi-user Support**: Handle multiple emergency situations simultaneously
- **Message Broadcasting**: Send alerts to all connected devices
- **User Management**: Monitor and manage user accounts and devices

#### **Technical Stack:**
- **Framework**: Next.js 15 with React 18
- **Styling**: Tailwind CSS
- **Maps**: Leaflet with React-Leaflet
- **Database**: Supabase with real-time subscriptions
- **Authentication**: Supabase Auth
- **TypeScript**: Full type safety

#### **Dashboard Features:**
- **SOS Alerts Panel**: Real-time emergency signal monitoring
- **Interactive Map**: Geographic view of all users and emergencies
- **Message Center**: Communication hub for emergency coordination
- **User Statistics**: Analytics on system usage and response times

## 🔄 System Integration

### Data Flow Architecture

1. **ESP32 Devices** collect GPS data and user inputs
2. **Python Serial Bridge** (`serial_python/`) connects ESP32 to cloud database
3. **Supabase Database** stores all emergency data and user information
4. **Mobile App** provides user interface and emergency communication
5. **Admin Web App** enables emergency response coordination

### Communication Protocols

- **ESP32 ↔ Database**: JSON over serial connection via Python bridge
- **Mobile App ↔ Database**: REST API and real-time subscriptions
- **Admin App ↔ Database**: Real-time subscriptions and REST API
- **ESP32 ↔ Mobile App**: Direct WiFi connection for configuration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- PlatformIO (for ESP32 development)
- Supabase account

### ESP32 Setup
1. Install PlatformIO
2. Configure `platformio.ini` with your ESP32 board settings
3. Upload the firmware to your ESP32 devices
4. Configure GPS and hardware connections

### Mobile App Setup
```bash
cd MobileUserApp
npm install
npx expo start
```

### Admin Web App Setup
```bash
cd admin-web-app
npm install
npm run dev
```

### Python Bridge Setup
```bash
cd ESP-32-Mesh/serial_python
pip install -r requirements.txt
python read_serial.py
```

## 🔧 Configuration

### ESP32 Configuration
- Update `USER_ID` in `main_testing.cpp`
- Configure WiFi credentials for AP mode
- Set GPS pins and hardware connections
- Adjust mesh network parameters

### Database Configuration
- Set up Supabase project
- Configure database tables and RLS policies
- Update connection strings in all applications

### Mobile App Configuration
- Configure Supabase connection in `lib/supabase.ts`
- Set up authentication providers
- Configure emergency contact settings

## 📊 Database Schema

### Key Tables
- **users**: User accounts and authentication
- **user_information**: Extended user profiles
- **esp_signals**: Device status and GPS data
- **sos_alerts**: Emergency signals and messages
- **messages**: Communication history

## 🛡️ Security Features

- **Authentication**: Supabase Auth with email/password
- **Row Level Security**: Database-level access control
- **Encrypted Communication**: HTTPS for all web communications
- **Device Authentication**: MAC address-based device identification

## 🔮 Future Enhancements

- **Bluetooth Integration**: Additional communication protocols
- **Offline Storage**: Local data caching for extended offline operation
- **AI-Powered Analysis**: Emergency pattern recognition
- **Multi-language Support**: International deployment capabilities
- **Advanced Analytics**: Predictive emergency response algorithms

## 📱 Use Cases

- **Wilderness Rescue**: Hikers and outdoor enthusiasts
- **Disaster Response**: Emergency services during natural disasters
- **Remote Work Safety**: Workers in isolated locations
- **Elderly Care**: Emergency assistance for elderly individuals
- **Event Security**: Large-scale event emergency management

## 🤝 Contributing

This project is designed for emergency response applications. Contributions should focus on:
- Reliability improvements
- Battery life optimization
- Communication range enhancement
- User interface accessibility
- Emergency response efficiency

## 📄 License

This project is designed for emergency response and safety applications. Please ensure compliance with local regulations and emergency service requirements.

---

**⚠️ Emergency Use Notice**: This system is designed for emergency situations. Always maintain backup communication methods and ensure proper testing before deployment in critical environments.

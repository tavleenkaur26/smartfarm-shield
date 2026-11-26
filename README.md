# SmartFarm Shield

SmartFarm Shield is an IoT-based animal husbandry monitoring and automation system developed as part of our third-semester IoT course. 

The system combines an ESP32-based physical model with a React web dashboard for automating routine feeding, water replenishment and lighting tasks, along with environmental and security monitoring.

## Features

### Hardware
- Automatic food dispensing using an ultrasonic sensor and servo motor
- Water level monitoring and automatic pump control
- Ambient light-based lighting control using an LDR
- Flame detection with buzzer alerts
- Intrusion detection using an IR sensor
- RFID-based access monitoring

### Web Dashboard
- Real-time sensor readings and device status
- Remote control of the feeder, water pump and lighting
- Historical sensor data visualization
- Animal record management
- Activity logs and notification history
- RFID access monitoring
- Device connectivity and command status tracking
- Light and dark mode

## Tech Stack

| Component | Technology |
|---|---|
| Microcontroller | ESP32 |
| Firmware | Arduino C++ |
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Database | Firebase Realtime Database |
| Authentication | Firebase Authentication |
| Data Visualization | Recharts |
| Communication | Wi-Fi |

## How It Works

The ESP32 collects sensor readings and controls the connected actuators based on predefined thresholds. Sensor data and device states are synchronized with Firebase Realtime Database over Wi-Fi.

The React dashboard retrieves this data for real-time monitoring, historical analysis and activity tracking. Manual control requests are sent through Firebase to the ESP32, enabling remote operation of connected devices alongside automatic hardware functionality.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/tavleenkaur26/smartfarm-shield.git
cd smartfarm-shield
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a `.env.local` file in the root directory with your Firebase configuration.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Enable Firebase Authentication and Realtime Database, and configure the required database paths and security rules.

### 4. Run the dashboard

```bash
npm run dev
```

## Future Scope

- Individual animal health and feeding records
- GPS-based livestock tracking
- Camera-based monitoring
- Water quality monitoring
- Mobile push notifications
- Solar-powered operation
